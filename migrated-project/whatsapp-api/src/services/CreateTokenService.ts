Filename: CreateTokenService.auto

class CreateTokenService:
    public async execute(phone: String, token: String) -> Token:
        tokenRepository = getCustomRepository(TokensRepository)

        checkTokenExists = await tokenRepository.findByPhone(phone)

        result = await tokenRepository.save(
            checkTokenExists.merge(
                phone=phone,
                token=token
            )
        )

        return result