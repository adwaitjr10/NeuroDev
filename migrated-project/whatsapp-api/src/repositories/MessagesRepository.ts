Filename: MessagesRepository.auto

import model Message

repository MessagesRepository for Message {
    
    findMessagesToSend() -> list of Message {
        messages = select from Message
            where (schedule_date <= now() and status = 'WAITING')
                or (schedule_date is null and status = 'WAITING')
            order by from desc, id desc
            limit 10
        return messages or null
    }
    
}