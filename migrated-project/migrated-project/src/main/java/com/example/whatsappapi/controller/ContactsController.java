Filename: migrated-project/src/main/java/com/example/whatsappapi/controller/ContactsController.java

```java
package com.example.whatsappapi.controller;

import com.example.whatsappapi.model.Contact;
import com.example.whatsappapi.service.ContactService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/contacts")
public class ContactsController {

    private final ContactService contactService;

    public ContactsController(ContactService contactService) {
        this.contactService = contactService;
    }

    @GetMapping("/{phoneNumber}")
    public ResponseEntity<List<Contact>> getContacts(@PathVariable String phoneNumber,
                                                     @RequestParam(defaultValue = "false") boolean onlyGroup) {
        List<Contact> contacts = contactService.getContacts(phoneNumber, onlyGroup);
        return ResponseEntity.ok(contacts);
    }
}
```