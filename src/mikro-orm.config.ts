import dotenv from 'dotenv'
dotenv.config()
const { POSTGRES_PASSWORD } = process.env

import { MikroORM } from '@mikro-orm/core'
import { __prod__ } from "./constants";
import { Post } from "./entities/Post";
import path from 'path'

export default {
    migrations: {
        path: path.join(__dirname, './migrations'), // path.join adds the parent location of the current file to the second argument
        pattern: /^[\w-]+\d+\.[tj]s$/
    },
    entities: [Post],
    dbName: 'lireddit',
    user: 'postgres',
    password: POSTGRES_PASSWORD,
    debug: !__prod__,
    type: 'postgresql'
} as Parameters<typeof MikroORM.init>[0];

//casting to a const aligns the types, avoiding an error
//casting to Parameters and importing the function gives typescript access to the types accepted in the particular function from MikroORM, allowing us to make sure the types match up