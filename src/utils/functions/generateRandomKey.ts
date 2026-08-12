import { randomBytes } from 'crypto';

export const generateRandomKey = (): string => {
    return randomBytes(32).toString('hex');
};
