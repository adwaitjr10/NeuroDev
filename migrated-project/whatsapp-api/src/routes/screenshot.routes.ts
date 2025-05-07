Filename: screenshot.routes.auto

import Router from 'auto/routing/Router'
import ScreenshotController from 'controllers/ScreenshotController'

let screenshotRouter = Router()
let screenshotController = ScreenshotController()

screenshotRouter.get('/', screenshotController.index)

export default screenshotRouter