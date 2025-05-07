Filename: migrated-project/src/main/java/com/example/whatsappapi/controller/MessagesController.java

```java
package com.example.whatsappapi.controller;

import com.example.whatsappapi.model.Message;
import com.example.whatsappapi.service.MessageService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import javax.validation.Valid;
import java.util.Map;

@RestController
@RequestMapping("/api/messages")
public class MessagesController {

    private final MessageService messageService;

    public MessagesController(MessageService messageService) {
        this.messageService = messageService;
    }

    @PostMapping
    public ResponseEntity<Message> createMessage(@Valid @RequestBody Message message) {
        Message createdMessage = messageService.createMessage(message);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdMessage);
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getMessages(Pageable pageable,
                                                           @RequestParam(required = false) String status) {
        Page<Message> messagesPage = messageService.getMessages(pageable, status);
        return ResponseEntity.ok(messageService.getMessagesResponse(messagesPage));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Message> getMessageById(@PathVariable Long id) {
        Message message = messageService.getMessageById(id);
        return ResponseEntity.ok(message);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMessage(@PathVariable Long id) {
        messageService.deleteMessage(id);
        return ResponseEntity.noContent().build();
    }
}
```