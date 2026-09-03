import OrderAction from '#models/order_action'
import type { HttpContext } from '@adonisjs/core/http'
import drive from '@adonisjs/drive/services/main'

const CONTENT_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
}

export default class ActionPhotoController {
  async show({ params, response }: HttpContext) {
    const action = await OrderAction.findOrFail(params.id)

    if (!action.photoPath) {
      return response.notFound()
    }

    const disk = drive.use()

    if (!(await disk.exists(action.photoPath))) {
      return response.notFound()
    }

    const extension = action.photoPath.split('.').pop()?.toLowerCase() ?? ''

    response.header('Content-Type', CONTENT_TYPES[extension] ?? 'application/octet-stream')
    response.header('Cache-Control', 'private, max-age=3600')

    return response.stream(await disk.getStream(action.photoPath))
  }
}
