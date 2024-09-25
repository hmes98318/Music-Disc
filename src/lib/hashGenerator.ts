import { createHash, randomBytes } from 'crypto';


const hashGenerator = {
    /**
     * Generates a random 32-byte key in hexadecimal format.
     * @returns {string} - A randomly generated key.
     */
    generateRandomKey: (): string => {
        return randomBytes(32).toString('hex');
    },

    /**
     * Generates a hash using the SHA-512 algorithm 
     * and a provided password along with a pre-generated salt.
     * @param {string} password - The password to be hashed.
     * @returns {string} - The hashed password.
     */
    generateHash: (password: string): string => {
        return createHash('sha512')
            .update(password + salt, 'utf-8')
            .digest('hex');
    }
};

export { hashGenerator };


// pre-generated salt
const salt = hashGenerator.generateRandomKey();
