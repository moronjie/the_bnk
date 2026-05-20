import dotenv from 'dotenv' 
dotenv.config()

type config = {
    port: number;
    nodeEnv: string;
    dbUrl: string;
    dbName: string;
    frontendUrl: string;
}

const config: config = {
    port: process.env.PORT ? parseInt(process.env.PORT) : 5000,
    nodeEnv: process.env.NODE_ENV || 'development',
    dbUrl: process.env.DB_URI || '',
    dbName: process.env.DB_NAME || '',
    frontendUrl: process.env.FRONTEND_URL || '',
}

export default config