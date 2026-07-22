import app from '@adonisjs/core/services/app'
import { BaseSeeder } from '@adonisjs/lucid/seeders'

export default class IndexSeeder extends BaseSeeder {
  private async seed(SeederModule: { default: typeof BaseSeeder }) {
    const Seeder = SeederModule.default

    if (Seeder.environment && !Seeder.environment.includes(app.nodeEnvironment)) {
      return
    }

    await new Seeder(this.client).run()
  }

  async run() {
    await this.seed(await import('#database/seeders/01_service_seeder'))
  }
}
