import { User } from '../entities/User'
import { MyContext } from '../types'
import { Resolver, Mutation, Arg, InputType, Field, Ctx, ObjectType } from 'type-graphql'
import argon2 from 'argon2'

@InputType()  //input for mutation
class UsernamePasswordInput {
    @Field()
    username: string
    @Field()
    password: string
}


//errors could be handled as a thrown error, but this is another way of getting it through a graphql response
@ObjectType()
class FieldError {
    @Field()
    field: string;
    @Field()
    message: string;
}

@ObjectType() //returned from mutation
class UserResponse {
    //returns one of the two fields depending upon whether there's an error
    @Field(() => [FieldError], { nullable: true })
    errors?: FieldError[]

    @Field(() => User, { nullable: true })
    user?: User
}

@Resolver()
export class UserResolver {
    @Mutation(() => UserResponse)
    async register(
        @Arg('options') options: UsernamePasswordInput,
        @Ctx() { em }: MyContext
    ): Promise<UserResponse> {
        if (options.username.length <= 2) {
            return {
                errors: [{
                    field: 'username',
                    message: 'Username must have at least three characters'
                }]
            }
        }
        if (options.password.length <= 3) {
            return {
                errors: [{
                    field: 'password',
                    message: 'Password must have at least 4 characters'
                }]
            }
        }
        const hashedPassword = await argon2.hash(options.password)
        const user = em.create(User, {
            username: options.username,
            password: hashedPassword
        })
        try {
            await em.persistAndFlush(user)
        } catch (err) {
            if (err.code === '23505' || err.detail.includes('already exists')) {
                //duplicate username
                return {
                    errors: [{
                        field: 'username',
                        message: 'Username has been taken'
                    }]
                }
            }
        }
        return { user }
    }

    @Mutation(() => UserResponse)
    async login(
        @Arg('options') options: UsernamePasswordInput,
        @Ctx() { em }: MyContext
    ): Promise<UserResponse> {
        const user = await em.findOne(User, { username: options.username })
        if (!user) {
            return {
                errors: [
                    {
                        field: "username",
                        message: "Username does not exist"
                    }
                ]
            }
        }
        const valid = await argon2.verify(user.password, options.password)
        if (!valid) {
            return {
                errors: [
                    {
                        field: "password",
                        message: "Incorrect password"
                    }
                ]
            }
        }


        return { user }
    }
}