import 'reflect-metadata';
import { DataSource } from 'typeorm';

export default new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 3306),
  database: process.env.DB_NAME ?? 'posapp',
  username: process.env.DB_USER ?? 'posapp',
  password: process.env.DB_PASSWORD ?? 'posapp',
  charset: 'utf8mb4',
  entities: [__dirname + '/**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
});
