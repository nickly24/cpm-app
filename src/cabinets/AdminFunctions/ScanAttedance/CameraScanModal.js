import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { API_BASE_URL } from '../../../Config';
import axios from '../../../api';

const SCAN_COOLDOWN_MS = 2200;
const SUCCESS_SHOW_MS = 1200;

export function CameraScanModal({ open, onClose, classDayId, onSuccess }) {
    const [frameState, setFrameState] = useState('idle'); // idle | scanning | success
    const [error, setError] = useState(null);
    const [cameraReady, setCameraReady] = useState(false);
    const lastScannedRef = useRef({ value: null, at: 0 });
    const scannerRef = useRef(null);
    const containerId = 'camera-scan-container';

    useEffect(() => {
        if (!open || !classDayId) return;

        setError(null);
        setFrameState('idle');
        setCameraReady(false);
        let mounted = true;
        let html5Qrcode = null;

        const startCamera = async () => {
            try {
                const cameras = await Html5Qrcode.getCameras();
                if (!cameras || cameras.length === 0) {
                    setError('Камера не найдена');
                    return;
                }
                if (!mounted) return;

                html5Qrcode = new Html5Qrcode(containerId);
                scannerRef.current = html5Qrcode;

                const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
                const cameraConfig = isMobile
                    ? { facingMode: 'environment' }
                    : cameras[0].id;

                await html5Qrcode.start(
                    cameraConfig,
                    {
                        fps: 10,
                        qrbox: { width: 260, height: 200 },
                        aspectRatio: 1,
                    },
                    (decodedText) => {
                        if (!mounted || !classDayId) return;
                        const now = Date.now();
                        if (lastScannedRef.current.value === decodedText && now - lastScannedRef.current.at < SCAN_COOLDOWN_MS) {
                            return;
                        }
                        lastScannedRef.current = { value: decodedText, at: now };

                        const rawId = String(decodedText).trim();
                        const studentId = rawId.replace(/^0+/, '') || rawId;
                        if (!studentId) return;

                        setFrameState('scanning');
                        axios
                            .post(
                                `${API_BASE_URL}/api/class-days/${classDayId}/attendance`,
                                { student_id: parseInt(studentId, 10), attendance_type_id: 1 }
                            )
                            .then((response) => {
                                if (!mounted) return;
                                const data = response.data;
                                if (data.status) {
                                    setFrameState('success');
                                    if (typeof onSuccess === 'function') {
                                        onSuccess({ studentId, data });
                                    }
                                    setTimeout(() => {
                                        if (mounted) setFrameState('idle');
                                    }, SUCCESS_SHOW_MS);
                                } else {
                                    setFrameState('idle');
                                    setError(data.error || 'Ошибка');
                                    setTimeout(() => setError(null), 4000);
                                }
                            })
                            .catch((err) => {
                                if (!mounted) return;
                                setFrameState('idle');
                                const msg = err.response?.data?.error || err.message || 'Ошибка сети';
                                setError(msg);
                                setTimeout(() => setError(null), 4000);
                            });
                    },
                    () => {}
                );
                if (mounted) setCameraReady(true);
            } catch (e) {
                if (mounted) setError(e?.message || 'Не удалось запустить камеру');
            }
        };

        startCamera();

        return () => {
            mounted = false;
            if (html5Qrcode && scannerRef.current) {
                html5Qrcode.stop().catch(() => {});
                scannerRef.current = null;
            }
        };
    }, [open, classDayId, onSuccess]);

    if (!open) return null;

    const frameClass = `camera-scan-frame camera-scan-frame--${frameState}`;

    return (
        <div className="camera-scan-overlay">
            <div className="camera-scan-modal">
                <div className="camera-scan-header">
                    <button type="button" className="camera-scan-back" onClick={onClose}>
                        ← Назад
                    </button>
                    <span className="camera-scan-title">Сканирование камерой</span>
                </div>
                <div className="camera-scan-body">
                    <div className="camera-scan-video-wrap">
                        <div id={containerId} className="camera-scan-reader" />
                        <div className="camera-scan-mask">
                            <div className={frameClass}>
                                <span className="camera-scan-frame-text">
                                    {frameState === 'idle' && 'Положите штрих-код или QR сюда'}
                                    {frameState === 'scanning' && 'Сканирование…'}
                                    {frameState === 'success' && '✓ Записан'}
                                </span>
                            </div>
                        </div>
                    </div>
                    {error && <div className="camera-scan-error">{error}</div>}
                </div>
            </div>
            <style>{`
                .camera-scan-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.85); z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 16px; box-sizing: border-box; }
                .camera-scan-modal { background: #1a1a1a; border-radius: 16px; overflow: hidden; max-width: 100%; width: 100%; max-height: 100vh; display: flex; flex-direction: column; }
                .camera-scan-header { display: flex; align-items: center; padding: 14px 16px; background: #252525; border-bottom: 1px solid #333; }
                .camera-scan-back { border: none; background: none; color: #a5b4fc; font-size: 15px; cursor: pointer; padding: 6px 0; }
                .camera-scan-back:hover { text-decoration: underline; }
                .camera-scan-title { margin-left: 12px; font-size: 16px; color: #e5e7eb; }
                .camera-scan-body { flex: 1; min-height: 0; display: flex; flex-direction: column; align-items: center; padding: 16px; }
                .camera-scan-video-wrap { position: relative; width: 100%; max-width: 400px; border-radius: 12px; overflow: hidden; background: #000; }
                .camera-scan-reader { width: 100%; min-height: 280px; }
                .camera-scan-reader video { width: 100%; display: block; }
                .camera-scan-mask { position: absolute; inset: 0; pointer-events: none; display: flex; align-items: center; justify-content: center; }
                .camera-scan-frame { width: 260px; height: 200px; border: 4px solid; border-radius: 12px; display: flex; align-items: center; justify-content: center; transition: border-color 0.25s, background-color 0.25s; }
                .camera-scan-frame-text { font-size: 14px; text-align: center; color: rgba(255,255,255,0.9); padding: 8px; }
                .camera-scan-frame--idle { border-color: #6b7280; background: rgba(107,114,128,0.2); }
                .camera-scan-frame--scanning { border-color: #f97316; background: rgba(249,115,22,0.25); }
                .camera-scan-frame--success { border-color: #22c55e; background: rgba(34,197,94,0.25); }
                .camera-scan-error { margin-top: 12px; padding: 10px 14px; border-radius: 8px; background: #7f1d1d; color: #fecaca; font-size: 14px; max-width: 100%; }
                #camera-scan-container #qr-shaded-region { display: none !important; }
            `}</style>
        </div>
    );
}
