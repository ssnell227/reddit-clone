import dotenv from 'dotenv'
dotenv.config()

import 'reflect-metadata'
import { MikroORM } from '@mikro-orm/core'
import { __prod__ } from './constants'
// import { Post } from './entities/Post'
import mikroOrmConfig from './mikro-orm.config'
import express from 'express'
import { ApolloServer } from 'apollo-server-express'
import { buildSchema } from 'type-graphql'
import { HelloResolver } from './resolvers/hello'
import { PostResolver } from './resolvers/post'
import { UserResolver } from './resolvers/user'

const { SERVER_PORT } = process.env

const main = async () => {
    const orm = await MikroORM.init(mikroOrmConfig) //initializes ORM according to config file
    await orm.getMigrator().up() //automatically runs migration in code, checking whether the database matches exactly with the entities in the project
    const app = express()

    const apolloServer = new ApolloServer({
        schema: await buildSchema({
            resolvers: [HelloResolver, PostResolver, UserResolver],
            validate: false
        }),
        context: () => ({ em: orm.em}) //context is available to all resolvers so that they can access em object
    })

    apolloServer.applyMiddleware({ app })

    app.listen(SERVER_PORT, () => {
        console.log(`server listening on ${SERVER_PORT}`)
    })
}

main().catch(err => {
    console.error(err)
})

