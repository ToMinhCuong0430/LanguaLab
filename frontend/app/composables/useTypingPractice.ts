import type { LearningLanguage } from './useLanguage'
import type { Database } from '~/types/database.types'
import { translateSupabaseError, handleAuthExpired } from '~/utils/supabaseErrors'

export interface TypingSentence {
  id: string
  sourceText: string // Nghĩa tiếng Việt
  targetText: string // Câu cần gõ
  phonetic?: string // IPA / Pinyin / Romaji
  hintWord?: string // Gợi ý từ tiếp theo
  grammarNote?: string
}

export interface TypingTopic {
  id: string
  slug: string
  lang: LearningLanguage
  title: string
  description: string
  group: 'life' | 'work'
  level: string
  iconName: string
  sentences: TypingSentence[]
}

export interface RoadmapNode {
  id: string
  level: string
  title: string
  status: 'completed' | 'active' | 'locked'
  xpRequired: number
}

// Lộ trình các chặng theo ngôn ngữ
export const ROADMAP_NODES: Record<LearningLanguage, RoadmapNode[]> = {
  en: [
    { id: 'en-a1', level: 'A1', title: 'Khởi động & Chào hỏi cơ bản', status: 'completed', xpRequired: 0 },
    { id: 'en-a2', level: 'A2', title: 'Đời sống thường nhật & Giao tiếp', status: 'completed', xpRequired: 150 },
    { id: 'en-b1', level: 'B1', title: 'Diễn đạt ý kiến & Thảo luận', status: 'active', xpRequired: 400 },
    { id: 'en-b2', level: 'B2', title: 'Thuyết trình & Công việc chuyên môn', status: 'locked', xpRequired: 800 },
    { id: 'en-c1', level: 'C1', title: 'Lập luận học thuật & Tư duy phản biện', status: 'locked', xpRequired: 1400 },
  ],
  zh: [
    { id: 'zh-hsk1', level: 'HSK 1', title: 'Phiên âm Pinyin & Khẩu ngữ nhập môn', status: 'completed', xpRequired: 0 },
    { id: 'zh-hsk2', level: 'HSK 2', title: 'Mua sắm, ăn uống & Sinh hoạt', status: 'active', xpRequired: 200 },
    { id: 'zh-hsk3', level: 'HSK 3', title: 'Giao tiếp công sở & Du lịch', status: 'locked', xpRequired: 500 },
    { id: 'zh-hsk4', level: 'HSK 4', title: 'Thảo luận chủ đề xã hội', status: 'locked', xpRequired: 900 },
    { id: 'zh-hsk5', level: 'HSK 5', title: 'Đọc báo chí & Văn phong học thuật', status: 'locked', xpRequired: 1500 },
    { id: 'zh-hsk6', level: 'HSK 6', title: 'Bản xứ hoá & Hán ngữ cao cấp', status: 'locked', xpRequired: 2200 },
  ],
  ja: [
    { id: 'ja-n5', level: 'N5', title: 'Bảng chữ cái & Chào hỏi đời thường', status: 'completed', xpRequired: 0 },
    { id: 'ja-n4', level: 'N4', title: 'Giao tiếp hàng quán & Chỉ đường', status: 'active', xpRequired: 250 },
    { id: 'ja-n3', level: 'N3', title: 'Hội thoại công việc & Kính ngữ sơ cấp', status: 'locked', xpRequired: 600 },
    { id: 'ja-n2', level: 'N2', title: 'Đọc tin tức & Thương mại Nhật Bản', status: 'locked', xpRequired: 1200 },
    { id: 'ja-n1', level: 'N1', title: 'Thành thạo văn phong văn bản cao cấp', status: 'locked', xpRequired: 2000 },
  ],
}

// 2 nhóm chủ đề: Tình huống đời sống (life) & Môi trường làm việc (work)
// Mỗi nhóm 2 chủ đề, Tiếng Anh có 8 câu/chủ đề, Trung và Nhật 4-5 câu/chủ đề.
export const MOCK_TYPING_TOPICS: TypingTopic[] = [
  // ========== TIẾNG ANH ==========
  // Nhóm 1: Tình huống đời sống
  {
    id: 'topic-en-shopping',
    slug: 'mua-sam',
    lang: 'en',
    title: 'Mua sắm & Trả giá',
    description: 'Hỏi giá, kích cỡ, khuyến mãi và cách trả giá khéo léo trong cửa hàng.',
    group: 'life',
    level: 'A2 - B1',
    iconName: 'ShoppingBag',
    sentences: [
      {
        id: 's-en-shop-1',
        sourceText: 'Bạn có cái áo len này với kích thước nhỏ hơn không?',
        targetText: 'Do you have this sweater in a smaller size?',
        phonetic: '/duː juː hæv ðɪs ˈswetər ɪn ə ˈsmɔːlər saɪz/',
        hintWord: 'sweater',
        grammarNote: 'Cấu trúc hỏi đồ vật ở kích thước khác: "in a smaller/larger size".',
      },
      {
        id: 's-en-shop-2',
        sourceText: 'Món đồ này có đang được áp dụng giảm giá không?',
        targetText: 'Is this item currently on sale?',
        phonetic: '/ɪz ðɪs ˈaɪtəm ˈkɜːrəntli ɒn seɪl/',
        hintWord: 'currently',
        grammarNote: '"on sale" có nghĩa là đang được giảm giá, khác với "for sale" (đang rao bán).',
      },
      {
        id: 's-en-shop-3',
        sourceText: 'Tôi có thể thử chiếc áo sơ mi này trong phòng thay đồ được không?',
        targetText: 'Can I try on this shirt in the fitting room?',
        phonetic: '/kæn aɪ traɪ ɒn ðɪs ʃɜːrt ɪn ðə ˈfɪtɪŋ ruːm/',
        hintWord: 'try on',
        grammarNote: 'Cụm động từ "try on" dùng khi thử quần áo, giày dép.',
      },
      {
        id: 's-en-shop-4',
        sourceText: 'Nếu tôi mua hai chiếc, bạn có thể giảm giá thêm chút không?',
        targetText: 'If I buy two, could you give me a slight discount?',
        phonetic: '/ɪf aɪ baɪ tuː kʊd juː ɡɪv miː ə slaɪt ˈdɪskaʊnt/',
        hintWord: 'slight discount',
        grammarNote: 'Dùng "could you" thể hiện lời đề nghị lịch sự, tế nhị.',
      },
      {
        id: 's-en-shop-5',
        sourceText: 'Chính sách đổi trả hàng của cửa hàng là trong vòng bao nhiêu ngày?',
        targetText: 'What is your return policy for damaged goods?',
        phonetic: '/wɒt ɪz jʊər rɪˈtɜːrn ˈpɒləsi fɔːr ˈdæmɪdʒd ɡʊdz/',
        hintWord: 'return policy',
        grammarNote: '"return policy" là cụm danh từ chỉ chính sách đổi trả hàng.',
      },
      {
        id: 's-en-shop-6',
        sourceText: 'Tôi có thể thanh toán bằng thẻ tín dụng không trả phí phụ thu chứ?',
        targetText: 'Can I pay by credit card without any surcharge?',
        phonetic: '/kæn aɪ peɪ baɪ ˈkredɪt kɑːrd wɪˈðaʊt ˈeni ˈsɜːrtʃɑːrdʒ/',
        hintWord: 'surcharge',
        grammarNote: '"surcharge" là phụ phí dịch vụ hoặc phí cà thẻ.',
      },
      {
        id: 's-en-shop-7',
        sourceText: 'Làm ơn gói món này làm quà tặng giúp tôi nhé.',
        targetText: 'Could you please gift wrap this item for me?',
        phonetic: '/kʊd juː pliːz ɡɪft ræp ðɪs ˈaɪtəm fɔːr miː/',
        hintWord: 'gift wrap',
        grammarNote: '"gift wrap" có thể dùng như động từ nghĩa là gói quà trang trọng.',
      },
      {
        id: 's-en-shop-8',
        sourceText: 'Tôi đang tìm kiếm một đôi giày chạy bộ có độ bám tốt.',
        targetText: 'I am looking for a pair of running shoes with good grip.',
        phonetic: '/aɪ æm ˈlʊkɪŋ fɔːr ə peər əv ˈrʌnɪŋ ʃuːz wɪð ɡʊd ɡrɪp/',
        hintWord: 'good grip',
        grammarNote: '"grip" chỉ độ ma sát, độ bám đường chống trượt của đế giày.',
      },
    ],
  },
  {
    id: 'topic-en-restaurant',
    slug: 'nha-hang',
    lang: 'en',
    title: 'Gọi món tại nhà hàng',
    description: 'Đặt bàn trước, hỏi món đặc trưng, yêu cầu gia vị và thanh toán hoá đơn.',
    group: 'life',
    level: 'A2 - B1',
    iconName: 'Utensils',
    sentences: [
      {
        id: 's-en-rest-1',
        sourceText: 'Tôi đã đặt một bàn cho bốn người dưới tên David lúc 7 giờ tối.',
        targetText: 'I have a reservation for four under the name David at seven.',
        phonetic: '/aɪ hæv ə ˌrezərˈveɪʃn fɔːr fɔːr ˈʌndər ðə neɪm ˈdeɪvɪd æt ˈsevn/',
        hintWord: 'reservation',
        grammarNote: 'Cấu trúc đặt chỗ: "have a reservation for [số người] under the name [tên]".',
      },
      {
        id: 's-en-rest-2',
        sourceText: 'Hôm nay nhà hàng có món đặc biệt nào gợi ý cho chúng tôi không?',
        targetText: 'What do you recommend as the chef special today?',
        phonetic: '/wɒt duː juː ˌrekəˈmend æz ðə ʃef ˈspeʃl təˈdeɪ/',
        hintWord: 'chef special',
        grammarNote: '"chef special" chỉ món sở trường đặc sắc trong ngày của bếp trưởng.',
      },
      {
        id: 's-en-rest-3',
        sourceText: 'Tôi bị dị ứng với hải sản, món này có chứa tôm hay cua không?',
        targetText: 'I am allergic to seafood, does this contain shrimp or crab?',
        phonetic: '/aɪ æm əˈlɜːrdʒɪk tuː ˈsiːfuːd dʌz ðɪs kənˈteɪn ʃrɪmp ɔːr kræb/',
        hintWord: 'allergic to',
        grammarNote: 'Cấu trúc "be allergic to something" diễn tả tình trạng dị ứng.',
      },
      {
        id: 's-en-rest-4',
        sourceText: 'Làm ơn cho tôi nước sốt để riêng ở đĩa nhỏ bên cạnh nhé.',
        targetText: 'Could we please have the dressing on the side?',
        phonetic: '/kʊd wiː pliːz hæv ðə ˈdresɪŋ ɒn ðə saɪd/',
        hintWord: 'on the side',
        grammarNote: '"on the side" nghĩa là để nước chấm/nước sốt riêng không tưới trực tiếp.',
      },
      {
        id: 's-en-rest-5',
        sourceText: 'Bạn có thể mang thêm cho chúng tôi một chai nước suối ướp lạnh không?',
        targetText: 'Could you bring us another bottle of chilled still water?',
        phonetic: '/kʊd juː brɪŋ ʌs əˈnʌðər ˈbɒtl əv tʃɪld stɪl ˈwɔːtər/',
        hintWord: 'still water',
        grammarNote: '"still water" là nước lọc không ga, đối lập với "sparkling water" (nước có ga).',
      },
      {
        id: 's-en-rest-6',
        sourceText: 'Thịt bò bít tết này được chế biến hơi chín quá so với yêu cầu của tôi.',
        targetText: 'This steak is slightly overcooked compared to medium rare.',
        phonetic: '/ðɪs steɪk ɪz ˈslaɪtli ˌoʊvərˈkʊkt kəmˈpeərd tuː ˈmiːdiəm reər/',
        hintWord: 'overcooked',
        grammarNote: '"overcooked" nghĩa là nấu quá lửa, "medium rare" là chín tái.',
      },
      {
        id: 's-en-rest-7',
        sourceText: 'Chúng tôi có thể xin hoá đơn thanh toán và chia đôi tiền được không?',
        targetText: 'Could we please have the bill and split the check evenly?',
        phonetic: '/kʊd wiː pliːz hæv ðə bɪl ænd splɪt ðə tʃek ˈiːvnli/',
        hintWord: 'split the check',
        grammarNote: '"split the check/bill" là cách nói người Mỹ để chia đều hoá đơn.',
      },
      {
        id: 's-en-rest-8',
        sourceText: 'Bữa tối hôm nay thực sự rất ngon miệng, cảm ơn sự phục vụ chu đáo!',
        targetText: 'Everything was absolutely delicious, thank you for the wonderful service!',
        phonetic: '/ˈevriθɪŋ wɒz ˌæbsəˈluːtli dɪˈlɪʃəs θæŋk juː fɔːr ðə ˈwʌndərfʊl ˈsɜːrvɪs/',
        hintWord: 'absolutely',
        grammarNote: 'Dùng "absolutely" đi với các tính từ cực hạn (extreme adjectives) như "delicious".',
      },
    ],
  },

  // Nhóm 2: Môi trường làm việc
  {
    id: 'topic-en-email',
    slug: 'email-cong-viec',
    lang: 'en',
    title: 'Soạn email công việc chuyên nghiệp',
    description: 'Mở đầu thư, đính kèm tài liệu, xác nhận lịch hẹn và lời kết trang trọng.',
    group: 'work',
    level: 'B1 - B2',
    iconName: 'Mail',
    sentences: [
      {
        id: 's-en-mail-1',
        sourceText: 'Tôi viết email này để xác nhận lịch họp của chúng ta vào thứ Sáu tới.',
        targetText: 'I am writing to confirm our upcoming meeting this Friday.',
        phonetic: '/aɪ æm ˈraɪtɪŋ tuː kənˈfɜːrm ˈaʊər ˈʌpˌkʌmɪŋ ˈmiːtɪŋ ðɪs ˈfraɪdeɪ/',
        hintWord: 'upcoming',
        grammarNote: 'Mẫu câu mở đầu chuẩn tắc: "I am writing to + V-infinitive".',
      },
      {
        id: 's-en-mail-2',
        sourceText: 'Vui lòng xem tập tin đính kèm để biết thêm chi tiết dự thảo hợp đồng.',
        targetText: 'Please find attached the draft agreement for your review.',
        phonetic: '/pliːz faɪnd əˈtætʃt ðə dræft əˈɡriːmənt fɔːr jʊər rɪˈvjuː/',
        hintWord: 'attached',
        grammarNote: 'Cách diễn đạt trang trọng khi đính kèm file trong thư thương mại.',
      },
      {
        id: 's-en-mail-3',
        sourceText: 'Tôi thành thật xin lỗi vì sự chậm trễ trong việc phản hồi thư của bạn.',
        targetText: 'I sincerely apologize for the delay in getting back to you.',
        phonetic: '/aɪ sɪnˈsɪərli əˈpɒlədʒaɪz fɔːr ðə dɪˈleɪ ɪn ˈɡetɪŋ bæk tuː juː/',
        hintWord: 'apologize',
        grammarNote: '"get back to someone" là phản hồi lại thư hoặc cuộc gọi.',
      },
      {
        id: 's-en-mail-4',
        sourceText: 'Nếu bạn cần thêm bất kỳ thông tin nào, xin đừng ngần ngại liên hệ tôi.',
        targetText: 'Should you require any further assistance, please do not hesitate to contact me.',
        phonetic: '/ʃʊd juː rɪˈkwaɪər ˈeni ˈfɜːrðər əˈsɪstəns pliːz duː nɒt ˈhezɪteɪt tuː ˈkɒntækt miː/',
        hintWord: 'hesitate',
        grammarNote: 'Đảo ngữ câu điều kiện loại 1 trang trọng: "Should you require...".',
      },
      {
        id: 's-en-mail-5',
        sourceText: 'Chúng tôi rất trân trọng sự hợp tác kịp thời của bạn trong dự án này.',
        targetText: 'We greatly appreciate your prompt cooperation on this urgent matter.',
        phonetic: '/wiː ˈɡreɪtli əˈpriːʃieɪt jʊər prɒmpt koʊˌɒpəˈreɪʃn ɒn ðɪs ˈɜːrdʒənt ˈmætər/',
        hintWord: 'prompt cooperation',
        grammarNote: '"prompt" có nghĩa là nhanh chóng, không chậm trễ.',
      },
      {
        id: 's-en-mail-6',
        sourceText: 'Tôi mong nhận được phản hồi và ý kiến đóng góp quý báu từ bạn sớm.',
        targetText: 'I look forward to hearing your valuable feedback very soon.',
        phonetic: '/aɪ lʊk ˈfɔːrwərd tuː ˈhɪərɪŋ jʊər ˈvæljuəbl ˈfiːdbæk ˈveri suːn/',
        hintWord: 'feedback',
        grammarNote: 'Nhớ dùng "hearing" (V-ing) sau giới từ "to" trong cấu trúc "look forward to".',
      },
      {
        id: 's-en-mail-7',
        sourceText: 'Bạn có thể vui lòng cập nhật lại ngân sách trước cuối ngày mai không?',
        targetText: 'Could you please provide the updated budget by tomorrow afternoon?',
        phonetic: '/kʊd juː pliːz prəˈvaɪd ðiː ʌpˈdeɪtɪd ˈbʌdʒɪt baɪ təˈmɒroʊ ˌæftərˈnuːn/',
        hintWord: 'budget',
        grammarNote: 'Giới từ "by" chỉ hạn chót (deadline) phải hoàn tất việc.',
      },
      {
        id: 's-en-mail-8',
        sourceText: 'Trân trọng kính thư, David Nguyen - Trưởng phòng kỹ thuật.',
        targetText: 'Best regards, David Nguyen - Technical Lead.',
        phonetic: '/best rɪˈɡɑːrdz ˈdeɪvɪd ŋuːˈjen ˈteknɪkl liːd/',
        hintWord: 'regards',
        grammarNote: '"Best regards" là lời chào kết thúc thư phổ biến và lịch thiệp nhất.',
      },
    ],
  },
  {
    id: 'topic-en-meeting',
    slug: 'hop-bao-cao',
    lang: 'en',
    title: 'Họp nhóm & Báo cáo tiến độ',
    description: 'Nêu ý kiến, ngắt lời lịch sự, trình bày biểu đồ và kết luận phiên họp.',
    group: 'work',
    level: 'B2 - C1',
    iconName: 'Users',
    sentences: [
      {
        id: 's-en-meet-1',
        sourceText: 'Chúng ta hãy bắt đầu cuộc họp bằng việc điểm lại các mục tiêu quý trước.',
        targetText: 'Let us kick off the meeting by reviewing our quarterly milestones.',
        phonetic: '/let ʌs kɪk ɒf ðə ˈmiːtɪŋ baɪ rɪˈvjuːɪŋ ˈaʊər ˈkwɔːrtərli ˈmaɪlstoʊnz/',
        hintWord: 'milestones',
        grammarNote: '"kick off" là cụm động từ tương đương "start / begin".',
      },
      {
        id: 's-en-meet-2',
        sourceText: 'Tôi hoàn toàn đồng tình với quan điểm của bạn về vấn đề này.',
        targetText: 'I could not agree more with your perspective on this strategy.',
        phonetic: '/aɪ kʊd nɒt əˈɡriː mɔːr wɪð jʊər pərˈspektɪv ɒn ðɪs ˈstrætədʒi/',
        hintWord: 'perspective',
        grammarNote: '"could not agree more" là cách diễn tả sự đồng ý tuyệt đối.',
      },
      {
        id: 's-en-meet-3',
        sourceText: 'Xin lỗi vì đã cắt ngang lời, nhưng tôi có một điểm mấu chốt cần làm rõ.',
        targetText: 'Sorry to interrupt, but I have a crucial point to clarify.',
        phonetic: '/ˈsɒri tuː ˌɪntəˈrʌpt bʌt aɪ hæv ə ˈkruːʃl pɔɪnt tuː ˈklærɪfaɪ/',
        hintWord: 'interrupt',
        grammarNote: 'Cách ngắt lời chuyên nghiệp mà vẫn giữ phép lịch thiệp.',
      },
      {
        id: 's-en-meet-4',
        sourceText: 'Theo như biểu đồ thể hiện, lượng người dùng tích cực đã tăng mạnh.',
        targetText: 'As shown on the chart, active user engagement has surged dramatically.',
        phonetic: '/æz ʃoʊn ɒn ðə tʃɑːrt ˈæktɪv ˈjuːzər ɪnˈɡeɪdʒmənt hæz sɜːrdʒd drəˈmætɪkli/',
        hintWord: 'surged',
        grammarNote: '"surge" nghĩa là dâng cao đột biến, rất hay dùng trong báo cáo kinh doanh.',
      },
      {
        id: 's-en-meet-5',
        sourceText: 'Chúng ta cần phân bổ thêm nhân lực để kịp tiến độ phát hành.',
        targetText: 'We must allocate more resources to meet the product launch deadline.',
        phonetic: '/wiː mʌst ˈæləkeɪt mɔːr rɪˈsɔːrsɪz tuː miːt ðə ˈprɒdʌkt lɔːntʃ ˈdedlaɪn/',
        hintWord: 'allocate',
        grammarNote: '"allocate resources" = phân bổ nguồn lực/nhân sự.',
      },
      {
        id: 's-en-meet-6',
        sourceText: 'Để tôi tóm tắt lại các đầu việc chính mà từng thành viên phụ trách.',
        targetText: 'Let me summarize the action items assigned to each team member.',
        phonetic: '/let miː ˈsʌməraɪz ðiː ˈækʃn ˈaɪtəmz əˈsaɪnd tuː iːtʃ tiːm ˈmembər/',
        hintWord: 'action items',
        grammarNote: '"action items" là thuật ngữ chỉ các nhiệm vụ cụ thể được giao sau cuộc họp.',
      },
      {
        id: 's-en-meet-7',
        sourceText: 'Có ai còn câu hỏi nào trước khi chúng ta kết thúc buổi họp không?',
        targetText: 'Does anyone have any further questions before we wrap up today?',
        phonetic: '/dʌz ˈeniwʌn hæv ˈeni ˈfɜːrðər ˈkwestʃənz bɪˈfɔːr wiː ræp ʌp təˈdeɪ/',
        hintWord: 'wrap up',
        grammarNote: '"wrap up" là cụm động từ thân mật để kết thúc một công việc hay cuộc họp.',
      },
      {
        id: 's-en-meet-8',
        sourceText: 'Biên bản cuộc họp chi tiết sẽ được gửi qua email cho tất cả các bên.',
        targetText: 'The detailed meeting minutes will be circulated via email shortly.',
        phonetic: '/ðə ˈdiːteɪld ˈmiːtɪŋ ˈmɪnɪts wɪl biː ˈsɜːrkjəleɪtɪd ˈvaɪə ˈiːmeɪl ˈʃɔːrtli/',
        hintWord: 'meeting minutes',
        grammarNote: '"meeting minutes" là biên bản cuộc họp.',
      },
    ],
  },

  // ========== TIẾNG TRUNG ==========
  {
    id: 'topic-zh-shopping',
    slug: 'mua-sam',
    lang: 'zh',
    title: 'Mua sắm & Mặc cả (买东西)',
    description: 'Hỏi giá, đổi trả và mặc cả tự nhiên tại chợ hoặc trung tâm thương mại.',
    group: 'life',
    level: 'HSK 2 - 3',
    iconName: 'ShoppingBag',
    sentences: [
      {
        id: 's-zh-shop-1',
        sourceText: 'Chiếc áo khoác này bao nhiêu tiền một cái?',
        targetText: '这件外套一件多少钱？',
        phonetic: 'Zhè jiàn wàitào yī jiàn duōshǎo qián?',
        hintWord: '多少钱',
        grammarNote: 'Lượng từ của áo khoác là 件 (jiàn).',
      },
      {
        id: 's-zh-shop-2',
        sourceText: 'Đắt quá, bạn có thể tính rẻ hơn một chút được không?',
        targetText: '太贵了，能不能便宜一点儿？',
        phonetic: 'Tài guì le, néng bù néng piányi yīdiǎnr?',
        hintWord: '便宜',
        grammarNote: 'Mẫu câu trả giá kinh điển: 能不能便宜一点儿？',
      },
      {
        id: 's-zh-shop-3',
        sourceText: 'Tôi có thể quét mã WeChat hoặc Alipay để thanh toán không?',
        targetText: '我可以扫微信或者支付宝付款吗？',
        phonetic: 'Wǒ kěyǐ sǎo wēixìn huòzhě zhīfùbǎo fùkuǎn ma?',
        hintWord: '扫码',
        grammarNote: '扫 (sǎo) nghĩa là quét mã QR thanh toán.',
      },
      {
        id: 's-zh-shop-4',
        sourceText: 'Kích cỡ này hơi chật, bạn có số lớn hơn một chút không?',
        targetText: '这个尺码有点儿紧，有大一号的吗？',
        phonetic: 'Zhège chǐmǎ yǒudiǎnr jǐn, yǒu dà yī hào de ma?',
        hintWord: '大一号',
        grammarNote: '大一号 (dà yī hào) nghĩa là số/size to hơn 1 cỡ.',
      },
    ],
  },
  {
    id: 'topic-zh-work',
    slug: 'email-cong-viec',
    lang: 'zh',
    title: 'Giao tiếp công sở & Báo cáo (商务办公)',
    description: 'Viết email, thảo luận tiến độ và bàn giao công việc với đối tác.',
    group: 'work',
    level: 'HSK 3 - 4',
    iconName: 'Briefcase',
    sentences: [
      {
        id: 's-zh-work-1',
        sourceText: 'Tôi đã gửi hợp đồng dự thảo qua hòm thư điện tử của bạn rồi.',
        targetText: '我已经把合同草案发到您的电子邮箱了。',
        phonetic: 'Wǒ yǐjīng bǎ hétóng cǎo\'àn fā dào nín de diànzǐ yóuxiāng le.',
        hintWord: '把合同草案',
        grammarNote: 'Câu chữ 把 nhấn mạnh đối tượng bị chuyển vị trí.',
      },
      {
        id: 's-zh-work-2',
        sourceText: 'Cuộc họp sáng mai sẽ lùi lại ba mươi phút do sự cố kỹ thuật.',
        targetText: '明早的会议因为技术原因推迟三十分钟。',
        phonetic: 'Míngzǎo de huìyì yīnwèi jìshù yuányīn tuīchí sānshí fēnzhōng.',
        hintWord: '推迟',
        grammarNote: '推迟 (tuīchí) nghĩa là hoãn lại, lùi giờ lại.',
      },
      {
        id: 's-zh-work-3',
        sourceText: 'Nếu quý công ty có bất kỳ thắc mắc nào, xin vui lòng liên hệ kịp thời.',
        targetText: '如果您有任何疑问，请随时与我们联系。',
        phonetic: 'Rúguǒ nín yǒu rènhé yíwèn, qǐng suíshí yǔ wǒmen liánxì.',
        hintWord: '联系',
        grammarNote: 'Cách nói trang trọng trong thư tín thương mại Trung Quốc.',
      },
      {
        id: 's-zh-work-4',
        sourceText: 'Chúng tôi mong muốn thiết lập mối quan hệ hợp tác lâu dài với bạn.',
        targetText: '我们期待与贵公司建立长期的合作关系。',
        phonetic: 'Wǒmen qīdài yǔ guì gōngsī jiànlì chángqī de hézuò guānxì.',
        hintWord: '合作关系',
        grammarNote: '贵公司 (quý công ty) là đại từ tôn kính đối tác.',
      },
    ],
  },

  // ========== TIẾNG NHẬT ==========
  {
    id: 'topic-ja-restaurant',
    slug: 'nha-hang',
    lang: 'ja',
    title: 'Nhà hàng & Quán ăn Nhật (レストラン)',
    description: 'Vào quán, gọi món theo set, xin thêm nước và gọi thanh toán O-kaikei.',
    group: 'life',
    level: 'N5 - N4',
    iconName: 'Utensils',
    sentences: [
      {
        id: 's-ja-rest-1',
        sourceText: 'Xin lỗi, làm ơn cho tôi xem thực đơn tiếng Anh được không?',
        targetText: 'すみません、英語のメニューはありますか？',
        phonetic: 'Sumimasen, eigo no menyuu wa arimasu ka?',
        hintWord: 'メニュー',
        grammarNote: 'すみません dùng mở đầu lời nhờ vả lịch sự.',
      },
      {
        id: 's-ja-rest-2',
        sourceText: 'Làm ơn cho tôi hai suất cơm thịt lợn chiên xù Tonkatsu.',
        targetText: 'とんかつ定食を二つお願いします。',
        phonetic: 'Tonkatsu teishoku o futatsu onegaishimasu.',
        hintWord: '二つ',
        grammarNote: 'Cách đếm đồ vật: 一つ (hitotsu), 二つ (futatsu).',
      },
      {
        id: 's-ja-rest-3',
        sourceText: 'Món này có cay lắm không ạ?',
        targetText: 'この料理はとても辛いですか？',
        phonetic: 'Kono ryouri wa totemo karai desu ka?',
        hintWord: '辛い',
        grammarNote: '辛い (karai) nghĩa là vị cay.',
      },
      {
        id: 's-ja-rest-4',
        sourceText: 'Làm ơn tính tiền giúp tôi nhé.',
        targetText: 'お会計をお願いします。',
        phonetic: 'O-kaikei o onegaishimasu.',
        hintWord: 'お会計',
        grammarNote: 'お会計 (o-kaikei) là từ chuẩn khi thanh toán tại nhà hàng Nhật.',
      },
    ],
  },
  {
    id: 'topic-ja-work',
    slug: 'email-cong-viec',
    lang: 'ja',
    title: 'Hội thoại công việc & Kính ngữ (ビジネス)',
    description: 'Chào hỏi đồng nghiệp, báo cáo tiến độ và cảm ơn đối tác trang trọng.',
    group: 'work',
    level: 'N4 - N3',
    iconName: 'Briefcase',
    sentences: [
      {
        id: 's-ja-work-1',
        sourceText: 'Cảm ơn mọi người đã vất vả làm việc ngày hôm nay.',
        targetText: '本日もお疲れ様でした。',
        phonetic: 'Honjitsu mo otsukaresama deshita.',
        hintWord: 'お疲れ様',
        grammarNote: 'Câu chào cửa miệng chuẩn tắc khi hết ca làm việc.',
      },
      {
        id: 's-ja-work-2',
        sourceText: 'Tôi xin phép được gửi tài liệu buổi họp qua thư đính kèm.',
        targetText: '会議の資料をメールにてお送りいたします。',
        phonetic: 'Kaigi no shiryou o meeru nite o-okuri itashimasu.',
        hintWord: 'お送りいたします',
        grammarNote: 'Khiêm nhường ngữ (Kenjougo): お + V-bỏ-masu + いたします.',
      },
      {
        id: 's-ja-work-3',
        sourceText: 'Rất mong nhận được sự chỉ giáo và giúp đỡ tận tình từ quý vị.',
        targetText: '今後とも何卒よろしくお願い申し上げます。',
        phonetic: 'Kongo tomo nanitazo yoroshiku onegai moushiagemasu.',
        hintWord: '何卒',
        grammarNote: 'Lời kết email trang trọng bậc nhất trong văn hóa kinh doanh Nhật.',
      },
      {
        id: 's-ja-work-4',
        sourceText: 'Về dự án lần này, chúng tôi sẽ nỗ lực hết mình để kịp tiến độ.',
        targetText: '今回のプロジェクトについて、全力を尽くします。',
        phonetic: 'Konkai no purojekuto ni tsuite, zenryoku o tsukushimasu.',
        hintWord: '全力を尽くす',
        grammarNote: 'Cụm thành ngữ "全力を尽くす" nghĩa là nỗ lực dốc toàn lực.',
      },
    ],
  },
]

export const useTypingPractice = (targetLang?: Ref<LearningLanguage>) => {
  const currentLang = targetLang || ref<LearningLanguage>('en')
  const client = useSupabaseClient<Database>()
  const authUser = useSupabaseUser()
  const config = useRuntimeConfig()

  const isLoading = ref(false)
  const errorMessage = ref<string | null>(null)
  const dbRoadmapNodes = ref<RoadmapNode[]>([])
  const dbTopics = ref<TypingTopic[]>([])

  // Tải dữ liệu từ Supabase
  const fetchTypingData = async () => {
    isLoading.value = true
    errorMessage.value = null

    try {
      const uid = authUser.value?.id

      // 1. Tải Lộ trình chặng (learning_stages) & tiến trình người dùng
      const stagesQuery = client
        .from('learning_stages')
        .select('*')
        .eq('stage_type', 'typing')
        .eq('language', currentLang.value)
        .order('sort_order', { ascending: true })

      const progressQuery = uid
        ? client.from('user_stage_progress').select('*').eq('user_id', uid)
        : Promise.resolve({ data: [] as any[] })

      // 2. Tải Chủ đề & Câu luyện gõ
      const topicsQuery = client
        .from('typing_topics')
        .select('*, typing_sentences(*)')
        .eq('language', currentLang.value)
        .order('sort_order', { ascending: true })

      const [stagesRes, progressRes, topicsRes] = await Promise.all([
        stagesQuery,
        progressQuery,
        topicsQuery,
      ])

      if (stagesRes.error) throw stagesRes.error
      if (topicsRes.error) throw topicsRes.error

      // Map roadmap
      if (stagesRes.data && stagesRes.data.length > 0) {
        const completedIds = new Set(
          (progressRes.data || [])
            .filter((p: any) => p.is_completed)
            .map((p: any) => p.stage_id)
        )

        let hasFoundActive = false
        dbRoadmapNodes.value = stagesRes.data.map((s) => {
          let status: 'completed' | 'active' | 'locked' = 'locked'
          if (completedIds.has(s.id)) {
            status = 'completed'
          } else if (!hasFoundActive) {
            status = 'active'
            hasFoundActive = true
          }
          return {
            id: s.id,
            level: s.level,
            title: s.title,
            status,
            xpRequired: s.xp_required,
          }
        })
      }

      // Map topics & sentences
      if (topicsRes.data && topicsRes.data.length > 0) {
        dbTopics.value = topicsRes.data.map((t: any) => {
          const rawSentences = (t.typing_sentences || []).sort(
            (a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0)
          )
          return {
            id: t.id,
            slug: t.id.replace(/^([a-z]{2})-([a-z]+)-/, ''),
            lang: t.language as LearningLanguage,
            title: t.title,
            description: t.description || '',
            group: t.group_type as 'life' | 'work',
            level: t.level,
            iconName: t.icon_name || 'ShoppingBag',
            sentences: rawSentences.map((s: any) => ({
              id: s.id,
              sourceText: s.translation,
              targetText: s.content,
              phonetic: s.reading || undefined,
              hintWord: s.hint_word || undefined,
              grammarNote: s.grammar_note || undefined,
            })),
          }
        })
      }
    } catch (err: any) {
      if (handleAuthExpired(err)) return
      errorMessage.value = translateSupabaseError(err)
      console.error('Lỗi khi tải dữ liệu gõ câu từ Supabase:', err.message)
    } finally {
      isLoading.value = false
    }
  }

  // Tự động fetch khi mount hoặc đổi ngôn ngữ
  onMounted(() => {
    fetchTypingData()
  })

  watch(currentLang, () => {
    fetchTypingData()
  })

  // Roadmap nodes: lấy từ DB thật
  const roadmapNodes = computed<RoadmapNode[]>(() => {
    if (dbRoadmapNodes.value.length > 0) {
      return dbRoadmapNodes.value
    }
    return ROADMAP_NODES[currentLang.value] || ROADMAP_NODES.en
  })

  // Topics: lấy từ DB thật
  const topicsForCurrentLang = computed<TypingTopic[]>(() => {
    if (dbTopics.value.length > 0) {
      return dbTopics.value
    }
    return MOCK_TYPING_TOPICS.filter(t => t.lang === currentLang.value)
  })

  const lifeTopics = computed(() => {
    return topicsForCurrentLang.value.filter(t => t.group === 'life')
  })

  const workTopics = computed(() => {
    return topicsForCurrentLang.value.filter(t => t.group === 'work')
  })

  const getTopicBySlug = (slug: string) => {
    return (
      topicsForCurrentLang.value.find(t => t.slug === slug || t.id === slug) ||
      MOCK_TYPING_TOPICS.find(t => (t.slug === slug || t.id === slug) && t.lang === currentLang.value) ||
      topicsForCurrentLang.value[0]
    )
  }

  // RPC: Nộp bài gõ câu an toàn
  const submitAttempt = async (
    topicId: string,
    wpm: number,
    accuracy: number,
    durationSeconds: number
  ) => {
    if (!authUser.value?.id) {
      return { success: false, error: 'Vui lòng đăng nhập để lưu kết quả bài gõ' }
    }

    try {
      const { data, error } = await client.rpc('submit_typing_attempt', {
        p_topic_id: topicId,
        p_wpm: wpm,
        p_accuracy: accuracy,
        p_duration_seconds: durationSeconds,
      })

      if (error) {
        if (handleAuthExpired(error)) return { success: false, error: 'Hết phiên đăng nhập' }
        return { success: false, error: translateSupabaseError(error) }
      }

      return {
        success: true,
        data,
      }
    } catch (err: any) {
      return { success: false, error: translateSupabaseError(err) }
    }
  }

  // RPC: Hoàn thành chặng học
  const completeStage = async (stageId: string) => {
    if (!authUser.value?.id) {
      return { success: false, error: 'Vui lòng đăng nhập để hoàn thành chặng' }
    }

    try {
      const { data, error } = await client.rpc('complete_stage', {
        p_stage_id: stageId,
      })

      if (error) {
        if (handleAuthExpired(error)) return { success: false }
        return { success: false, error: translateSupabaseError(error) }
      }

      // Refresh roadmap sau khi hoàn thành
      await fetchTypingData()
      return { success: true, data }
    } catch (err: any) {
      return { success: false, error: translateSupabaseError(err) }
    }
  }

  return {
    roadmapNodes,
    topicsForCurrentLang,
    lifeTopics,
    workTopics,
    getTopicBySlug,
    isLoading,
    errorMessage,
    fetchTypingData,
    submitAttempt,
    completeStage,
  }
}

// Alias cho tên useTyping
export const useTyping = useTypingPractice
