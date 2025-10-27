import React, { useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../Config';
import './CreateZap.css';

export default function CreateZap({ onBack }) {
    const [text, setText] = useState('');
    const [images, setImages] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const studentId = localStorage.getItem('id');

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        
        files.forEach(file => {
            // Проверяем формат файла (jpg, jpeg, heic)
            const validFormats = ['image/jpeg', 'image/jpg', 'image/heic'];
            if (!validFormats.includes(file.type)) {
                setError('Поддерживаются только форматы JPG и HEIC');
                return;
            }

            // Проверяем размер (максимум 5MB)
            if (file.size > 5 * 1024 * 1024) {
                setError('Размер файла не должен превышать 5MB');
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                setImages(prev => [...prev, {
                    file: file,
                    preview: URL.createObjectURL(file),
                    base64: e.target.result
                }]);
            };
            reader.readAsDataURL(file);
        });
    };

    const removeImage = (index) => {
        setImages(prev => {
            const newImages = prev.filter((_, i) => i !== index);
            prev[index].preview && URL.revokeObjectURL(prev[index].preview);
            return newImages;
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!text.trim()) {
            setError('Пожалуйста, введите текст запроса');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // Преобразуем изображения в base64
            const imagesBase64 = images.map(img => img.base64);

            const response = await axios.post(`${API_BASE_URL}/api/create-zap`, {
                student_id: studentId,
                text: text,
                images: imagesBase64
            });

            if (response.data.status) {
                setSuccess(true);
                setTimeout(() => {
                    onBack();
                }, 2000);
            } else {
                setError(response.data.error || 'Ошибка при создании запроса');
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Ошибка при отправке запроса');
            console.error('Ошибка:', err);
        } finally {
            setIsLoading(false);
        }
    };

    if (success) {
        return (
            <div className="create-zap-container">
                <div className="success-message">
                    ✅ Запрос успешно создан! Номер обращения: #{new Date().getTime()}
                </div>
            </div>
        );
    }

    return (
        <div className="create-zap-container">
            <h2>Создать запрос на отгул</h2>
            
            {error && <div className="error-message">{error}</div>}
            
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Текст запроса:</label>
                    <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Опишите причину отгула..."
                        rows="5"
                        disabled={isLoading}
                    />
                </div>

                <div className="form-group">
                    <label>Фотографии справок (необязательно):</label>
                    <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/heic"
                        multiple
                        onChange={handleFileChange}
                        disabled={isLoading}
                    />
                    <div className="help-text">Можно загрузить несколько фото. Форматы: JPG, HEIC. Макс. размер: 5MB</div>
                </div>

                {images.length > 0 && (
                    <div className="images-preview">
                        <h3>Загруженные фото:</h3>
                        <div className="images-grid">
                            {images.map((img, index) => (
                                <div key={index} className="image-item">
                                    <img src={img.preview} alt={`Фото ${index + 1}`} />
                                    <button
                                        type="button"
                                        onClick={() => removeImage(index)}
                                        disabled={isLoading}
                                    >
                                        Удалить
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="form-actions">
                    <button type="button" onClick={onBack} disabled={isLoading}>
                        Отмена
                    </button>
                    <button type="submit" disabled={isLoading}>
                        {isLoading ? 'Отправка...' : 'Отправить запрос'}
                    </button>
                </div>
            </form>
        </div>
    );
}

