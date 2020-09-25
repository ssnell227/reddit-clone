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
import connectRedis from 'connect-redis'

import redis from 'redis'
import session from 'express-session'
import { MyContext } from './types'



const { SERVER_PORT } = process.env

const main = async () => {
    const orm = await MikroORM.init(mikroOrmConfig) //initializes ORM according to config file
    await orm.getMigrator().up() //automatically runs migration in code, checking whether the database matches exactly with the entities in the project
    const app = express()

    const RedisStore = connectRedis(session)
    const redisClient = redis.createClient()

    app.use(
        session({
            name: 'qid',
            //disable touch is on because the tutorial leaves no expiration on the cookie, so there's no need to have touch on.  Otherwise, it's important to have touch on to ensure that users' sessions stay current even if they don't change any data
            store: new RedisStore({ 
                client: redisClient, 
                disableTouch:true
            }),
            cookie: {
                maxAge: 1000 * 60 * 24 * 365,
                httpOnly: true,
                secure: __prod__, //cookie only works in https. can be a trip up in dev if set to true
                sameSite: 'lax'
            },
            secret: 'replace this later',
            resave: false,
        })
    )

    const apolloServer = new ApolloServer({
        schema: await buildSchema({
            resolvers: [HelloResolver, PostResolver, UserResolver],
            validate: false
        }),
        context: ({req, res}): MyContext => ({ em: orm.em, req, res }) //context is available to all resolvers so that they can access em object
    })

    apolloServer.applyMiddleware({ app })

    app.listen(SERVER_PORT, () => {
        console.log(`server listening on ${SERVER_PORT}`)
    })
}

main().catch(err => {
    console.error(err)
})

