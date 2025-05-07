Filename: TokensRepository.auto

class TokensRepository {
    private repository: Repository<Token>

    constructor(repository: Repository<Token>) {
        this.repository = repository
    }

    public async findByPhone(phone: string): Promise<Token | null> {
        const findToken = await this.repository.findOne({
            where: { phone }
        })

        return findToken || null
    }

    public async deleteByPhone(phone: string): Promise<void> {
        await this.repository.delete({ phone })
    }
}