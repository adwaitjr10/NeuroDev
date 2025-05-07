Filename: CreateUserService.auto

class CreateUserService {
    public async execute(username: string, password: string, admin: boolean): Promise<User> {
        const usersRepository = getRepository(User);

        const checkUserExists = await usersRepository.findOne({
            where: { username }
        });

        if (checkUserExists) {
            throw new AppError('User already exists.');
        }

        const hashdKey = await hash(password, 8);

        const newUser = usersRepository.create({
            username,
            admin,
            password: hashdKey
        });

        await usersRepository.save(newUser);

        return newUser;
    }
}