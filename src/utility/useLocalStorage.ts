import {useEffect, useState} from 'react';

const getStorageData = <T>(key: string, defaultValue: T) => {
    const savedItem = localStorage.getItem(key);
    return savedItem ? JSON.parse(savedItem) : defaultValue;
};

type UseLocalStorageResult<T> = [T, (value: T) => void];

export function useLocalStorage<T>(
    key: string,
    defaultValue: T,
): UseLocalStorageResult<T> {
    const [value, setValue] = useState<T>(() =>
        getStorageData(key, defaultValue),
    );

    useEffect(() => {
        localStorage.setItem(key, JSON.stringify(value));
    }, [key, value]);

    return [value, setValue];
}
