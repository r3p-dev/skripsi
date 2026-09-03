import WhatsappService from '#notifications/whatsapp_service'
import ProfileService, {
  PHONE_VERIFICATION_ROUTE,
  type PhoneVerificationRoute,
} from '#services/profile_service'
import { Role } from '#enums/role_enum'
import { inject } from '@adonisjs/core'

@inject()
export default class StaffProfileService extends ProfileService {
  protected readonly phoneVerificationRoute: PhoneVerificationRoute =
    PHONE_VERIFICATION_ROUTE[Role.STAFF]

  constructor(whatsappService: WhatsappService) {
    super(whatsappService)
  }
}
