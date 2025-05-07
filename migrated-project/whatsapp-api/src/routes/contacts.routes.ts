Filename: contacts.routes.auto

import auto3pm
import ContactsController

@auto3pm.route("/contacts/<phoneNumber>", methods=["GET"])
def index(phoneNumber):
    controller = ContactsController()
    return controller.index(phoneNumber)