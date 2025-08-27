export class ConfigService {

    getValue(key) {
        const value = import.meta.env[key];
        if (value === undefined) {
            throw new Error(`Configuration Error: Variabel "${key}" tidak disetel di lingkungan Anda.`);
        }
        return value;
    }

    getNumber(key) {
        const value = this.getValue(key);
        const numberValue = parseInt(value, 10);
        if (isNaN(numberValue)) {
            throw new Error(`Configuration Error: Variabel "${key}" bukan angka yang valid.`);
        }
        return numberValue;
    }
}

export const configService = new ConfigService();