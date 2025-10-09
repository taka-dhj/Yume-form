type TemplateVars = {
  guestName: string;
  bookingId: string;
  checkinDate: string;
  nights: number;
  formUrl: string;
};

type ReminderVars = {
  guestName: string;
  bookingId: string;
  checkinDate: string;
  daysUntilCheckin: number;
  formUrl: string;
};

export const emailTemplates = {
  initial: {
    ja: {
      subject: (vars: TemplateVars) => `【夢殿】ご予約確認とご質問 - ${vars.checkinDate}ご宿泊`,
      body: (vars: TemplateVars) => `${vars.guestName} 様

いつもありがとうございます。
${vars.checkinDate}より${vars.nights}泊のご予約をいただき、誠にありがとうございます。

ご宿泊に際しまして、いくつかご質問がございます。
お決まりになりましたら、下記のフォームよりご回答をお願いいたします。

【ご回答フォーム】
${vars.formUrl}

ご質問内容：
1) ご宿泊者全員の性別をお知らせください
   ※お子様がいらっしゃる場合は、年齢と性別もお知らせください

2) 日本へのご到着日を教えてください

3) チェックイン前日の宿泊場所を教えてください

4) ご予約には夕食が含まれておりません。よろしいでしょうか？
   ※夕食を追加される場合は、1名様24,000円（当日お支払い）となります
   ※追加をご希望の場合は、1週間前までにお知らせください
   ※夕食の内容は海鮮を多く使った日本料理（懐石コース）です
   ※メニューは料理長におまかせとなります
   ※重度の食物アレルギーや魚介類が食べられない方には、安全上の理由からお食事を提供できません

5) 当日のご到着時刻を教えてください
   ※夕食付きの方は、必ず17時までにご到着ください
   ※17時以降のご到着の場合、夕食の提供ができません

6) 日本国内で使える携帯電話をお持ちですか？
   お持ちの場合は、電話番号をお知らせください

上記フォームよりご回答をお待ちしております。
ご不明な点がございましたら、お気軽にお問い合わせください。

夢殿
予約ID: ${vars.bookingId}`,
    },
    en: {
      subject: (vars: TemplateVars) => `【Yumedono】Reservation Confirmation & Questions - Check-in ${vars.checkinDate}`,
      body: (vars: TemplateVars) => `Dear Mr./Ms. ${vars.guestName}

Hello,
Thank you for your reservation on ${vars.checkinDate} for ${vars.nights} night stay.

We have some questions for you.
Please inform us your details after you decided.

【Response Form】
${vars.formUrl}

Questions:
1) Please let us know the gender of all guests.
   *If you have any children, please let us know their age and gender.

2) When will you arrive in Japan?

3) Where will you stay on the night before check-in?

4) Your booking doesn't include dinner. Is it OK?
   ※If you need dinner, it will take 24,000 yen (per person / per night).
   You have to tell us about this in advance if you need.
   The content of dinner will be Japanese foods which are using a lot of seafood (It is called Kaiseki course).
   Regarding the menu, it will depend on the chef.
   The guest can't specify the menu.

   ※We are afraid we can't provide the dinner for the guest who has serious allergy to food or can't eat seafood(include fish).
   Also, if the guest have serious allergy to food, we are afraid we cannot provide our meals (both dinner and breakfast) because it will relate life-threatening.

5) What time will you arrive at Yumedono on that day?
   ※If you would like to add dinner, you must arrive by 5:00 PM.
   There is a possibility that we can't prepare dinner if you will be late.
   In that case, we are afraid you have to pay the dinner cost even if you couldn't have dinner because the cancellation charge will be 100%.
   Please note it.

6) Do you have a cellular-phone which is usable in Japan?
   If you have, please inform us your telephone number.

Please submit your response through the form above.
If you have any questions, please feel free to contact us.

Best regards,
Yumedono
Booking ID: ${vars.bookingId}`,
    },
  },
  reminder: {
    ja: {
      subject: (vars: ReminderVars) => `【夢殿】ご回答のお願い（再送）- ${vars.checkinDate}ご宿泊`,
      body: (vars: ReminderVars) => `${vars.guestName} 様

いつもありがとうございます。

${vars.checkinDate}のご宿泊まで、残り${vars.daysUntilCheckin}日となりました。

以前お送りしたご質問フォームへのご回答をまだいただけておりません。
スムーズなご案内のため、お早めのご回答をお願いいたします。

【ご回答フォーム】
${vars.formUrl}

ご回答いただけていない場合は、お手数ですが上記フォームよりご回答をお願いいたします。
すでにご回答済みの場合は、本メールをご放念ください。

ご不明な点がございましたら、お気軽にお問い合わせください。

夢殿
予約ID: ${vars.bookingId}`,
    },
    en: {
      subject: (vars: ReminderVars) => `【Yumedono】Reminder: Response Needed - Check-in ${vars.checkinDate}`,
      body: (vars: ReminderVars) => `Dear Mr./Ms. ${vars.guestName}

Hello,

Your check-in date (${vars.checkinDate}) is ${vars.daysUntilCheckin} days away.

We have not yet received your response to our questionnaire.
To ensure a smooth check-in experience, we kindly request your response as soon as possible.

【Response Form】
${vars.formUrl}

If you have not responded yet, please submit your answers through the form above.
If you have already responded, please disregard this email.

If you have any questions, please feel free to contact us.

Best regards,
Yumedono
Booking ID: ${vars.bookingId}`,
    },
  },
  reception: {
    ja: {
      subject: (vars: TemplateVars) => `【夢殿】ご予約受付完了 - ${vars.checkinDate}ご宿泊`,
      body: (vars: TemplateVars) => `${vars.guestName} 様

いつもありがとうございます。

${vars.checkinDate}より${vars.nights}泊のご予約につきまして、ご回答をいただき誠にありがとうございました。
受付が完了いたしましたことをご報告申し上げます。

当日は心よりお待ちしております。
ご不明な点がございましたら、お気軽にお問い合わせください。

夢殿
予約ID: ${vars.bookingId}`,
    },
    en: {
      subject: (vars: TemplateVars) => `【Yumedono】Reception Completed - Check-in ${vars.checkinDate}`,
      body: (vars: TemplateVars) => `Dear Mr./Ms. ${vars.guestName}

Hello,

Thank you for your response regarding your reservation on ${vars.checkinDate} for ${vars.nights} night stay.
We are pleased to inform you that your reception is now complete.

We look forward to welcoming you on the day.
If you have any questions, please feel free to contact us.

Best regards,
Yumedono
Booking ID: ${vars.bookingId}`,
    },
  },
};

export function generateEmail(
  type: 'initial',
  language: 'ja' | 'en',
  vars: TemplateVars
): { subject: string; body: string };
export function generateEmail(
  type: 'reminder',
  language: 'ja' | 'en',
  vars: ReminderVars
): { subject: string; body: string };
export function generateEmail(
  type: 'reception',
  language: 'ja' | 'en',
  vars: TemplateVars
): { subject: string; body: string };
export function generateEmail(
  type: 'initial' | 'reminder' | 'reception',
  language: 'ja' | 'en',
  vars: TemplateVars | ReminderVars
): { subject: string; body: string } {
  if (type === 'initial' || type === 'reception') {
    const template = emailTemplates[type][language];
    return {
      subject: template.subject(vars as TemplateVars),
      body: template.body(vars as TemplateVars),
    };
  } else {
    const template = emailTemplates.reminder[language];
    return {
      subject: template.subject(vars as ReminderVars),
      body: template.body(vars as ReminderVars),
    };
  }
}

