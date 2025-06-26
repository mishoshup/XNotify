import dotenv from 'dotenv'
import { Twilio } from 'twilio'
import { getLatestPost } from './scraper'

dotenv.config()

const twilio = new Twilio(process.env.TWILIO_SID!, process.env.TWILIO_TOKEN!)

const trackedUsers = ['h47172776']
const seenPosts: Record<string, string> = {}

async function checkPosts() {
  for (const user of trackedUsers) {
    const post = await getLatestPost(user)

    if (post && post.url !== seenPosts[user]) {
      seenPosts[user] = post.url
      const msg = `🐦 @${user} Posted:\n\n${post.text}\n\n🔗 ${post.url}`

      await twilio.messages.create({
        body: msg,
        from: process.env.TWILIO_FROM!,
        to: process.env.TWILIO_TO!
      })

      console.log(`✅ Sent post from @${user}`)
    }
  }
}

checkPosts()
setInterval(checkPosts, 30 * 1000)
