```java
package com.example.whatsappapi.controller;

import com.example.whatsappapi.model.Message;
import com.example.whatsappapi.service.MessageService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/messages")
public class MessageController {

    private final MessageService messageService;

    public MessageController(MessageService messageService) {
        this.messageService = messageService;
    }

    @GetMapping
    public ResponseEntity<Page<Message>> getAllMessages(Pageable pageable) {
        return new ResponseEntity<>(messageService.findAllMessages(pageable), HttpStatus.OK);
    }

    @PostMapping
    public ResponseEntity<Message> createMessage(@RequestBody Message message) {
        return new ResponseEntity<>(messageService.saveMessage(message), HttpStatus.CREATED);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Message> getMessageById(@PathVariable Long id) {
        return new ResponseEntity<>(messageService.findMessageById(id), HttpStatus.OK);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<HttpStatus> deleteMessage(@PathVariable Long id) {
        messageService.deleteMessage(id);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }
}
```