import React, { useState } from 'react';
import MyZaps from './MyZaps';
import CreateZap from './CreateZap';

export default function ZapsContainer() {
    const [view, setView] = useState('list'); // 'list' или 'create'

    if (view === 'create') {
        return (
            <CreateZap 
                onBack={() => setView('list')}
            />
        );
    }

    return (
        <MyZaps 
            onBack={() => window.history.back()}
            onCreateNew={() => setView('create')}
        />
    );
}

