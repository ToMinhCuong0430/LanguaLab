import type { LearningLanguage } from './useLanguage'
import type { Database } from '~/types/database.types'
import { translateSupabaseError, handleAuthExpired } from '~/utils/supabaseErrors'

export interface VocabWord {
  id: string
  term: string
  phonetic: string
  partOfSpeech: string
  meaning: string
  exampleTarget: string
  exampleMeaning: string
  srsState?: 'again' | 'hard' | 'good' | 'easy' | 'new'
  lastReviewed?: string
}

export interface VocabSet {
  id: string
  title: string
  description: string
  level: string
  lang: LearningLanguage
  isCustom?: boolean
  createdAt?: string
  words: VocabWord[]
}

// Mock 3 bộ đề xuất (mỗi bộ 10 từ) cho Tiếng Anh, cùng các bộ mẫu cho Trung và Nhật
export const CURATED_VOCAB_SETS: VocabSet[] = [
  // ========== TIẾNG ANH (3 bộ đề xuất x 10 từ) ==========
  {
    id: 'curated-en-1',
    title: 'Oxford 3000 từ vựng học thuật cốt lõi',
    description: 'Nền tảng từ vựng học thuật quan trọng nhất xuất hiện trong mọi bài thi và văn bản quốc tế.',
    level: 'B1 - B2',
    lang: 'en',
    words: [
      {
        id: 'w-en-1-1',
        term: 'Resilient',
        phonetic: '/rɪˈzɪliənt/',
        partOfSpeech: 'adj',
        meaning: 'Kiên cường, có khả năng phục hồi nhanh chóng sau nghịch cảnh.',
        exampleTarget: 'Local communities have proven remarkably resilient in the face of natural disasters.',
        exampleMeaning: 'Các cộng đồng địa phương đã chứng minh sự kiên cường đáng nể trước thiên tai.',
      },
      {
        id: 'w-en-1-2',
        term: 'Allocate',
        phonetic: '/ˈæləkeɪt/',
        partOfSpeech: 'verb',
        meaning: 'Phân bổ, chỉ định nguồn vốn hoặc tài nguyên cho mục đích cụ thể.',
        exampleTarget: 'The government decided to allocate more funds to renewable energy research.',
        exampleMeaning: 'Chính phủ đã quyết định phân bổ thêm ngân quỹ cho nghiên cứu năng lượng tái tạo.',
      },
      {
        id: 'w-en-1-3',
        term: 'Comprehensive',
        phonetic: '/ˌkɒmprɪˈhensɪv/',
        partOfSpeech: 'adj',
        meaning: 'Toàn diện, bao hàm đầy đủ mọi khía cạnh.',
        exampleTarget: 'The university offers a comprehensive guide to international student admissions.',
        exampleMeaning: 'Trường đại học cung cấp một cuốn cẩm nang toàn diện về tuyển sinh du học sinh.',
      },
      {
        id: 'w-en-1-4',
        term: 'Diminish',
        phonetic: '/dɪˈmɪnɪʃ/',
        partOfSpeech: 'verb',
        meaning: 'Làm giảm bớt, suy yếu về số lượng hoặc tầm ảnh hưởng.',
        exampleTarget: 'His influence in the company did not diminish despite recent controversies.',
        exampleMeaning: 'Ảnh hưởng của ông ấy tại công ty không hề giảm sút dù vướng phải những tranh cãi gần đây.',
      },
      {
        id: 'w-en-1-5',
        term: 'Facilitate',
        phonetic: '/fəˈsɪlɪteɪt/',
        partOfSpeech: 'verb',
        meaning: 'Tạo điều kiện thuận lợi, làm cho một quá trình trở nên dễ dàng hơn.',
        exampleTarget: 'Digital tools help facilitate smoother communication among remote employees.',
        exampleMeaning: 'Các công cụ kỹ thuật số giúp tạo điều kiện giao tiếp trôi chảy hơn giữa nhân viên làm việc từ xa.',
      },
      {
        id: 'w-en-1-6',
        term: 'Implicit',
        phonetic: '/ɪmˈplɪsɪt/',
        partOfSpeech: 'adj',
        meaning: 'Ngấm ngầm, ẩn ý, không nói toạc ra nhưng ai cũng hiểu.',
        exampleTarget: 'There was an implicit agreement that no one would bring up the painful topic.',
        exampleMeaning: 'Có một sự ngầm đồng thuận rằng không ai được phép nhắc lại chủ đề đau buồn ấy.',
      },
      {
        id: 'w-en-1-7',
        term: 'Legitimate',
        phonetic: '/lɪˈdʒɪtɪmət/',
        partOfSpeech: 'adj',
        meaning: 'Hợp pháp, chính đáng, có căn cứ xác đáng.',
        exampleTarget: 'The consumers raised legitimate concerns regarding data privacy violations.',
        exampleMeaning: 'Người tiêu dùng đã nêu lên những quan ngại chính đáng liên quan đến vi phạm quyền riêng tư.',
      },
      {
        id: 'w-en-1-8',
        term: 'Perspective',
        phonetic: '/pərˈspektɪv/',
        partOfSpeech: 'noun',
        meaning: 'Góc nhìn, quan điểm cá nhân đối với một sự vật hiện tượng.',
        exampleTarget: 'Traveling abroad helps people gain a much broader perspective on diverse cultures.',
        exampleMeaning: 'Đi du lịch nước ngoài giúp con người có được góc nhìn rộng mở hơn về các nền văn hóa đa dạng.',
      },
      {
        id: 'w-en-1-9',
        term: 'Subsequent',
        phonetic: '/ˈsʌbsɪkwənt/',
        partOfSpeech: 'adj',
        meaning: 'Xảy ra sau đó, tiếp theo theo trình tự thời gian.',
        exampleTarget: 'Subsequent investigations confirmed that the initial report was entirely accurate.',
        exampleMeaning: 'Các cuộc điều tra tiếp theo sau đó đã xác nhận rằng bản báo cáo ban đầu hoàn toàn chính xác.',
      },
      {
        id: 'w-en-1-10',
        term: 'Underlying',
        phonetic: '/ˌʌndərˈlaɪɪŋ/',
        partOfSpeech: 'adj',
        meaning: 'Căn bản, nằm sâu bên dưới, là gốc rễ của vấn đề.',
        exampleTarget: 'Stress is often the underlying cause of many chronic health issues.',
        exampleMeaning: 'Căng thẳng thường là nguyên nhân gốc rễ sâu xa của nhiều vấn đề sức khỏe mãn tính.',
      },
    ],
  },
  {
    id: 'curated-en-2',
    title: 'Từ vựng tinh hoa IELTS 7.5+ Writing & Speaking',
    description: 'Các từ vựng học thuật cao cấp C1 giúp tăng điểm tiêu chí Lexical Resource trong kỳ thi IELTS.',
    level: 'C1 - C2',
    lang: 'en',
    words: [
      {
        id: 'w-en-2-1',
        term: 'Plausible',
        phonetic: '/ˈplɔːzəbl/',
        partOfSpeech: 'adj',
        meaning: 'Hợp lý, có vẻ đúng, đáng tin cậy.',
        exampleTarget: 'The scientist offered a plausible hypothesis for the sudden extinction event.',
        exampleMeaning: 'Nhà khoa học đã đưa ra một giả thuyết hợp lý cho sự kiện tuyệt chủng đột ngột.',
      },
      {
        id: 'w-en-2-2',
        term: 'Mitigate',
        phonetic: '/ˈmɪtɪɡeɪt/',
        partOfSpeech: 'verb',
        meaning: 'Làm giảm nhẹ bớt tác hại hoặc mức độ nghiêm trọng.',
        exampleTarget: 'Reforestation plays an indispensable role in mitigating climate change impacts.',
        exampleMeaning: 'Tái trồng rừng đóng vai trò không thể thiếu trong việc giảm nhẹ tác động của biến đổi khí hậu.',
      },
      {
        id: 'w-en-2-3',
        term: 'Detrimental',
        phonetic: '/ˌdetrɪˈmentl/',
        partOfSpeech: 'adj',
        meaning: 'Có hại, gây tổn hại nghiêm trọng.',
        exampleTarget: 'Sedentary lifestyles have a distinctly detrimental effect on cognitive functions.',
        exampleMeaning: 'Lối sống ít vận động gây ra tác hại rõ rệt đối với các chức năng nhận thức não bộ.',
      },
      {
        id: 'w-en-2-4',
        term: 'Ubiquitous',
        phonetic: '/juːˈbɪkwɪtəs/',
        partOfSpeech: 'adj',
        meaning: 'Có mặt ở khắp mọi nơi, cực kỳ phổ biến.',
        exampleTarget: 'Artificial intelligence is becoming increasingly ubiquitous in daily applications.',
        exampleMeaning: 'Trí tuệ nhân tạo đang ngày càng trở nên phổ biến ở khắp nơi trong các ứng dụng thường nhật.',
      },
      {
        id: 'w-en-2-5',
        term: 'Pragmatic',
        phonetic: '/præɡˈmætɪk/',
        partOfSpeech: 'adj',
        meaning: 'Thực tế, thực dụng, dựa trên tính khả thi thay vì lý thuyết.',
        exampleTarget: 'Policymakers must adopt a pragmatic mindset when revising public healthcare laws.',
        exampleMeaning: 'Các nhà hoạch định chính sách phải áp dụng tư duy thực tế khi sửa đổi luật y tế công cộng.',
      },
      {
        id: 'w-en-2-6',
        term: 'Juxtapose',
        phonetic: '/ˌdʒʌkstəˈpoʊz/',
        partOfSpeech: 'verb',
        meaning: 'Đặt cạnh nhau để so sánh sự tương phản rõ rệt.',
        exampleTarget: 'The exhibition juxtaposes contemporary modern art with traditional woodcut prints.',
        exampleMeaning: 'Buổi triển lãm đặt nghệ thuật đương đại cạnh tranh khắc gỗ truyền thống để thấy sự đối lập.',
      },
      {
        id: 'w-en-2-7',
        term: 'Superfluous',
        phonetic: '/suːˈpɜːrfluəs/',
        partOfSpeech: 'adj',
        meaning: 'Thừa thãi, không cần thiết, vượt quá mức đòi hỏi.',
        exampleTarget: 'Eliminating superfluous packaging helps reduce millions of tons of plastic waste.',
        exampleMeaning: 'Cắt giảm bao bì thừa thãi giúp giảm thiểu hàng triệu tấn rác thải nhựa.',
      },
      {
        id: 'w-en-2-8',
        term: 'Discrepancy',
        phonetic: '/dɪˈskrepənsi/',
        partOfSpeech: 'noun',
        meaning: 'Sự sai lệch, bất đồng giữa hai số liệu hoặc câu chuyện.',
        exampleTarget: 'Auditors uncovered a noticeable discrepancy between the receipts and bank records.',
        exampleMeaning: 'Các kiểm toán viên đã phát hiện sự sai lệch đáng chú ý giữa biên lai và sổ sách ngân hàng.',
      },
      {
        id: 'w-en-2-9',
        term: 'Exacerbate',
        phonetic: '/ɪɡˈzæsərbeɪt/',
        partOfSpeech: 'verb',
        meaning: 'Làm trầm trọng thêm, khiến tình hình xấu đi.',
        exampleTarget: 'Heavy industrial emissions will inevitably exacerbate the existing smog epidemic.',
        exampleMeaning: 'Khí thải công nghiệp nặng chắc chắn sẽ làm trầm trọng thêm dịch khói mù hiện tại.',
      },
      {
        id: 'w-en-2-10',
        term: 'Prevalent',
        phonetic: '/ˈprevələnt/',
        partOfSpeech: 'adj',
        meaning: 'Thịnh hành, lan tràn rộng khắp trong cộng đồng.',
        exampleTarget: 'Anxiety disorders are increasingly prevalent among urban adolescents today.',
        exampleMeaning: 'Rối loạn lo âu đang ngày càng lan tràn phổ biến trong giới thanh thiếu niên đô thị ngày nay.',
      },
    ],
  },
  {
    id: 'curated-en-3',
    title: 'Tiếng Anh thương mại & Giao tiếp công sở',
    description: 'Bộ từ vựng giao tiếp thực chiến nơi làm việc: đàm phán hợp đồng, quản lý dự án và báo cáo.',
    level: 'B2',
    lang: 'en',
    words: [
      {
        id: 'w-en-3-1',
        term: 'Streamline',
        phonetic: '/ˈstriːmlaɪn/',
        partOfSpeech: 'verb',
        meaning: 'Tinh gọn hoá, đơn giản hoá quy trình để tăng hiệu suất.',
        exampleTarget: 'We need to streamline our internal approval process to speed up deliveries.',
        exampleMeaning: 'Chúng ta cần tinh gọn hoá quy trình phê duyệt nội bộ để đẩy nhanh tiến độ giao hàng.',
      },
      {
        id: 'w-en-3-2',
        term: 'Leverage',
        phonetic: '/ˈlevərɪdʒ/',
        partOfSpeech: 'verb',
        meaning: 'Tận dụng tối đa đòn bẩy hoặc lợi thế có sẵn.',
        exampleTarget: 'The startup managed to leverage strategic partnerships to expand overseas.',
        exampleMeaning: 'Công ty khởi nghiệp đã tận dụng quan hệ đối tác chiến lược để mở rộng ra nước ngoài.',
      },
      {
        id: 'w-en-3-3',
        term: 'Bottleneck',
        phonetic: '/ˈbɒtlnek/',
        partOfSpeech: 'noun',
        meaning: 'Điểm nghẽn, nơi làm chậm toàn bộ dây chuyền hoạt động.',
        exampleTarget: 'Manual quality control testing became the main bottleneck in our production line.',
        exampleMeaning: 'Kiểm thử chất lượng thủ công đã trở thành điểm nghẽn chính trên dây chuyền sản xuất.',
      },
      {
        id: 'w-en-3-4',
        term: 'Consensus',
        phonetic: '/kənˈsensəs/',
        partOfSpeech: 'noun',
        meaning: 'Sự đồng thuận chung của cả tập thể.',
        exampleTarget: 'After two hours of intense debate, the board reached a unanimous consensus.',
        exampleMeaning: 'Sau hai giờ tranh luận căng thẳng, ban giám đốc đã đạt được sự đồng thuận nhất trí.',
      },
      {
        id: 'w-en-3-5',
        term: 'Benchmark',
        phonetic: '/ˈbentʃmɑːrk/',
        partOfSpeech: 'noun',
        meaning: 'Tiêu chuẩn đối sánh, chuẩn mực để so sánh đánh giá.',
        exampleTarget: 'Their customer satisfaction rating serves as a reliable benchmark for our industry.',
        exampleMeaning: 'Tỷ lệ hài lòng khách hàng của họ được dùng làm chuẩn đối sánh đáng tin cậy cho ngành.',
      },
      {
        id: 'w-en-3-6',
        term: 'Viable',
        phonetic: '/ˈvaɪəbl/',
        partOfSpeech: 'adj',
        meaning: 'Khả thi, có khả năng tồn tại và sinh lời lâu dài.',
        exampleTarget: 'Subscription pricing turned out to be a financially viable business model.',
        exampleMeaning: 'Thu phí định kỳ đã chứng minh là một mô hình kinh doanh khả thi về mặt tài chính.',
      },
      {
        id: 'w-en-3-7',
        term: 'Contingency',
        phonetic: '/kənˈtɪndʒənsi/',
        partOfSpeech: 'noun',
        meaning: 'Kế hoạch dự phòng cho tình huống bất ngờ có thể xảy ra.',
        exampleTarget: 'Every risk assessment must include a solid contingency plan for server outages.',
        exampleMeaning: 'Mọi đánh giá rủi ro đều phải bao gồm kế hoạch dự phòng vững chắc cho sự cố sập máy chủ.',
      },
      {
        id: 'w-en-3-8',
        term: 'Scalable',
        phonetic: '/ˈskeɪləbl/',
        partOfSpeech: 'adj',
        meaning: 'Có khả năng mở rộng quy mô mà không giảm hiệu năng.',
        exampleTarget: 'Cloud infrastructure provides a highly scalable solution for rapid user growth.',
        exampleMeaning: 'Hạ tầng điện toán đám mây cung cấp giải pháp mở rộng quy mô linh hoạt khi người dùng tăng.',
      },
      {
        id: 'w-en-3-9',
        term: 'Accountability',
        phonetic: '/əˌkaʊntəˈbɪləti/',
        partOfSpeech: 'noun',
        meaning: 'Trách nhiệm giải trình, chịu trách nhiệm về kết quả hành động.',
        exampleTarget: 'Clear ownership fosters individual accountability across cross-functional teams.',
        exampleMeaning: 'Phân quyền rõ ràng thúc đẩy tinh thần trách nhiệm giải trình cá nhân giữa các phòng ban.',
      },
      {
        id: 'w-en-3-10',
        term: 'Incentive',
        phonetic: '/ɪnˈsentɪv/',
        partOfSpeech: 'noun',
        meaning: 'Động lực khuyến khích, phần thưởng kích thích làm việc.',
        exampleTarget: 'Performance-based bonuses provide a strong financial incentive for sales teams.',
        exampleMeaning: 'Thưởng theo hiệu quả đem lại động lực tài chính mạnh mẽ cho đội ngũ kinh doanh.',
      },
    ],
  },

  // ========== TIẾNG TRUNG ==========
  {
    id: 'curated-zh-1',
    title: 'HSK 3 - 4 Từ vựng cốt lõi khẩu ngữ & đời sống',
    description: 'Bộ từ vựng Hán ngữ thông dụng nhất trong giao tiếp hàng ngày và thương mại.',
    level: 'HSK 3 - 4',
    lang: 'zh',
    words: [
      {
        id: 'w-zh-1-1',
        term: '坚持',
        phonetic: 'jiān chí',
        partOfSpeech: 'động từ',
        meaning: 'Kiên trì, giữ vững quyết tâm không từ bỏ.',
        exampleTarget: '只要坚持努力，你终会取得令人瞩目的成绩。',
        exampleMeaning: 'Chỉ cần kiên trì nỗ lực, bạn cuối cùng sẽ đạt thành tích đáng nể.',
      },
      {
        id: 'w-zh-1-2',
        term: '深刻',
        phonetic: 'shēn kè',
        partOfSpeech: 'tính từ',
        meaning: 'Sâu sắc, để lại dấu ấn khó phai.',
        exampleTarget: '这次经历给我留下了极为深刻的记忆。',
        exampleMeaning: 'Trải nghiệm lần này đã để lại cho tôi ký ức vô cùng sâu sắc.',
      },
      {
        id: 'w-zh-1-3',
        term: '适应',
        phonetic: 'shì yìng',
        partOfSpeech: 'động từ',
        meaning: 'Thích nghi, quen dần với môi trường mới.',
        exampleTarget: '来到新城市后，他很快便适应了那里的生活节奏。',
        exampleMeaning: 'Sau khi đến thành phố mới, anh ấy nhanh chóng thích nghi với nhịp sống nơi đó.',
      },
      {
        id: 'w-zh-1-4',
        term: '积累',
        phonetic: 'jī lěi',
        partOfSpeech: 'động từ / danh từ',
        meaning: 'Tích luỹ từng chút một theo thời gian.',
        exampleTarget: '学习语言需要日积月累，不可急于求成。',
        exampleMeaning: 'Học ngôn ngữ cần tích luỹ từng ngày, không thể nóng vội.',
      },
      {
        id: 'w-zh-1-5',
        term: '沟通',
        phonetic: 'gōu tōng',
        partOfSpeech: 'động từ',
        meaning: 'Giao tiếp, trao đổi thấu hiểu lẫn nhau.',
        exampleTarget: '良好的沟通是解决团队矛盾的关键钥匙。',
        exampleMeaning: 'Giao tiếp tốt là chìa khoá then chốt để giải quyết mâu thuẫn nhóm.',
      },
      {
        id: 'w-zh-1-6',
        term: '详细',
        phonetic: 'xiáng xì',
        partOfSpeech: 'tính từ',
        meaning: 'Chi tiết, tường tận, không bỏ sót điều gì.',
        exampleTarget: '请为您负责的方案制定一份详细的执行计划。',
        exampleMeaning: 'Xin vui lòng lập một kế hoạch thực hiện chi tiết cho phương án của bạn.',
      },
      {
        id: 'w-zh-1-7',
        term: '陪同',
        phonetic: 'péi tóng',
        partOfSpeech: 'động từ',
        meaning: 'Đi cùng, tháp tùng ai đó một cách chu đáo.',
        exampleTarget: '总经理在助手的陪同下视察了新建的研发中心。',
        exampleMeaning: 'Tổng giám đốc dưới sự tháp tùng của trợ lý đã thị sát trung tâm R&D mới xây.',
      },
      {
        id: 'w-zh-1-8',
        term: '丰富',
        phonetic: 'fēng fù',
        partOfSpeech: 'tính từ / động từ',
        meaning: 'Phong phú, dồi dào về kiến thức hoặc nội dung.',
        exampleTarget: '经常阅读课外书籍可以丰富我们的精神世界。',
        exampleMeaning: 'Thường xuyên đọc sách ngoài giờ có thể làm phong phú thế giới tinh thần của chúng ta.',
      },
      {
        id: 'w-zh-1-9',
        term: '诚恳',
        phonetic: 'chéng kěn',
        partOfSpeech: 'tính từ',
        meaning: 'Chân thành, thành thật từ tận đáy lòng.',
        exampleTarget: '他诚恳的态度打动了在场所有的评委老师。',
        exampleMeaning: 'Thái độ chân thành của anh ấy đã làm xúc động tất cả thầy cô giám khảo có mặt.',
      },
      {
        id: 'w-zh-1-10',
        term: '关键',
        phonetic: 'guān jiàn',
        partOfSpeech: 'danh từ / tính từ',
        meaning: 'Then chốt, mấu chốt quyết định thành bại.',
        exampleTarget: '在关键时刻保持冷静是优秀领导者的特质。',
        exampleMeaning: 'Giữ được bình tĩnh vào thời khắc then chốt là phẩm chất của nhà lãnh đạo ưu tú.',
      },
    ],
  },

  // ========== TIẾNG NHẬT ==========
  {
    id: 'curated-ja-1',
    title: 'JLPT N3 - N2 Từ vựng thông dụng trong đời sống & Công ty',
    description: 'Từ vựng thiết yếu giúp bạn vượt qua kỳ thi năng lực tiếng Nhật và làm việc tại Nhật.',
    level: 'N3 - N2',
    lang: 'ja',
    words: [
      {
        id: 'w-ja-1-1',
        term: '改善',
        phonetic: 'かいぜん (Kaizen)',
        partOfSpeech: 'danh từ / suru',
        meaning: 'Cải tiến liên tục để ngày càng tốt hơn.',
        exampleTarget: '作業の効率を改善するため、新しい手順を導入した。',
        exampleMeaning: 'Để cải thiện hiệu suất công việc, chúng tôi đã đưa vào quy trình mới.',
      },
      {
        id: 'w-ja-1-2',
        term: '思いやり',
        phonetic: 'おもいやり (Omoiyari)',
        partOfSpeech: 'danh từ',
        meaning: 'Sự thấu hiểu, chu đáo và biết nghĩ cho người khác.',
        exampleTarget: '相手への思いやりを持って接することが信頼につながる。',
        exampleMeaning: 'Ứng xử với sự quan tâm nghĩ cho đối phương sẽ dẫn đến sự tin tưởng.',
      },
      {
        id: 'w-ja-1-3',
        term: '柔軟',
        phonetic: 'じゅうなん (Juunan)',
        partOfSpeech: 'tính từ na',
        meaning: 'Mềm dẻo, linh hoạt ứng biến theo tình huống.',
        exampleTarget: '予期せぬ変化にも柔軟に対応できる姿勢が求められる。',
        exampleMeaning: 'Cần có tinh thần ứng biến linh hoạt trước những đổi thay bất ngờ.',
      },
      {
        id: 'w-ja-1-4',
        term: '妥協',
        phonetic: 'だきょう (Dakyou)',
        partOfSpeech: 'danh từ / suru',
        meaning: 'Thoả hiệp, nhượng bộ để đạt điểm chung.',
        exampleTarget: '双方が譲り合い、ようやく妥協点に達した。',
        exampleMeaning: 'Cả hai bên cùng nhượng bộ và cuối cùng đã đạt được điểm thoả hiệp.',
      },
      {
        id: 'w-ja-1-5',
        term: '貢献',
        phonetic: 'こうけん (Kouken)',
        partOfSpeech: 'danh từ / suru',
        meaning: 'Cống hiến, đóng góp tích cực cho xã hội.',
        exampleTarget: '地域社会の発展に貢献する活動に積極的に参加している。',
        exampleMeaning: 'Chúng tôi tích cực tham gia các hoạt động đóng góp cho sự phát triển địa phương.',
      },
      {
        id: 'w-ja-1-6',
        term: '的確',
        phonetic: 'てきかく (Tekikaku)',
        partOfSpeech: 'tính từ na',
        meaning: 'Chính xác, trúng đích, xác đáng.',
        exampleTarget: '状況を的確に把握し、速やかに次の手を打つ必要がある。',
        exampleMeaning: 'Cần nắm bắt tình hình một cách chính xác và nhanh chóng triển khai bước tiếp theo.',
      },
      {
        id: 'w-ja-1-7',
        term: '把握',
        phonetic: 'はあく (Haaku)',
        partOfSpeech: 'danh từ / suru',
        meaning: 'Nắm vững, thấu suốt toàn diện vấn đề.',
        exampleTarget: 'プロジェクトの進捗状況をリアルタイムで把握する。',
        exampleMeaning: 'Nắm bắt tiến độ của dự án theo thời gian thực.',
      },
      {
        id: 'w-ja-1-8',
        term: '迅速',
        phonetic: 'じんそく (Jinsoku)',
        partOfSpeech: 'tính từ na',
        meaning: 'Nhanh chóng, thần tốc, không chần chừ.',
        exampleTarget: '顧客からの問い合わせには迅速に対応しなければならない。',
        exampleMeaning: 'Phải phản hồi một cách nhanh chóng các thắc mắc từ phía khách hàng.',
      },
      {
        id: 'w-ja-1-9',
        term: '誠実',
        phonetic: 'せいじつ (Seijitsu)',
        partOfSpeech: 'tính từ na',
        meaning: 'Thành thực, chân thành và đáng tin cậy.',
        exampleTarget: '誠実な仕事ぶりが高く評価され、昇進が決まった。',
        exampleMeaning: 'Tác phong làm việc chân chính được đánh giá cao và anh đã được thăng chức.',
      },
      {
        id: 'w-ja-1-10',
        term: '綿密',
        phonetic: 'めんみつ (Menmitsu)',
        partOfSpeech: 'tính từ na',
        meaning: 'Tỉ mỉ, chu đáo, cẩn thận từng chi tiết nhỏ.',
        exampleTarget: '綿密な計画を立ててから実行に移すことが成功の秘訣だ。',
        exampleMeaning: 'Lập kế hoạch tỉ mỉ chu đáo trước khi thực hiện là bí quyết của thành công.',
      },
    ],
  },
]

export const useVocab = (targetLang?: Ref<LearningLanguage>) => {
  const currentLang = targetLang || ref<LearningLanguage>('en')
  const client = useSupabaseClient<Database>()
  const authUser = useSupabaseUser()
  const config = useRuntimeConfig()

  const isUseMock = computed(() => {
    return (
      config.public.useMock === true ||
      config.public.useMock === 'true' ||
      process.env.NUXT_PUBLIC_USE_MOCK === 'true'
    )
  })

  // Tab: 'curated' (Bộ đề xuất) | 'my_sets' (Bộ của tôi)
  const activeTab = ref<'curated' | 'my_sets'>('curated')
  const isLoading = ref(false)
  const errorMessage = ref<string | null>(null)

  // Dữ liệu từ Supabase
  const dbCuratedSets = ref<VocabSet[]>([])
  const dbMySets = ref<VocabSet[]>([])

  // Bộ của tôi (lưu localStorage dự phòng)
  const localMySets = ref<VocabSet[]>([])

  // Tải dữ liệu từ Supabase
  const fetchVocabData = async () => {
    if (isUseMock.value) return

    isLoading.value = true
    errorMessage.value = null

    try {
      const uid = authUser.value?.id

      // 1. Tải bộ đề xuất hệ thống
      const { data: curatedData, error: curatedErr } = await client
        .from('vocab_sets')
        .select('*, vocab_words(*)')
        .eq('is_system', true)
        .eq('language', currentLang.value)
        .order('created_at', { ascending: true })

      if (curatedErr) throw curatedErr

      if (curatedData) {
        dbCuratedSets.value = curatedData.map((s: any) => ({
          id: s.id,
          title: s.title,
          description: s.description || '',
          level: s.level_id ? `Level ${s.level_id}` : 'B1 - B2',
          lang: (s.language as LearningLanguage) || 'en',
          isCustom: false,
          words: (s.vocab_words || []).map((w: any) => ({
            id: w.id,
            term: w.word,
            phonetic: w.phonetic || w.reading || '',
            partOfSpeech: w.part_of_speech || 'noun',
            meaning: w.meaning_vi,
            exampleTarget: w.example_sentence || '',
            exampleMeaning: w.example_translation || '',
            srsState: 'new',
          })),
        }))
      }

      // 2. Tải bộ từ cá nhân của người dùng
      if (uid) {
        const { data: myData, error: myErr } = await client
          .from('vocab_sets')
          .select('*, vocab_words(*)')
          .eq('user_id', uid)
          .eq('language', currentLang.value)
          .order('created_at', { ascending: false })

        if (myErr) throw myErr

        if (myData) {
          dbMySets.value = myData.map((s: any) => ({
            id: s.id,
            title: s.title,
            description: s.description || '',
            level: 'Tự tạo',
            lang: (s.language as LearningLanguage) || 'en',
            isCustom: true,
            createdAt: s.created_at?.split('T')[0],
            words: (s.vocab_words || []).map((w: any) => ({
              id: w.id,
              term: w.word,
              phonetic: w.phonetic || w.reading || '',
              partOfSpeech: w.part_of_speech || 'noun',
              meaning: w.meaning_vi,
              exampleTarget: w.example_sentence || '',
              exampleMeaning: w.example_translation || '',
              srsState: 'new',
            })),
          }))
        }
      }
    } catch (err: any) {
      if (handleAuthExpired(err)) return
      errorMessage.value = translateSupabaseError(err)
      console.warn('Lỗi khi tải từ vựng từ Supabase, dùng mock fallback:', err.message)
    } finally {
      isLoading.value = false
    }
  }

  onMounted(() => {
    if (import.meta.client) {
      const saved = localStorage.getItem('langua_my_vocab_sets')
      if (saved) {
        try {
          localMySets.value = JSON.parse(saved)
        } catch {
          localMySets.value = []
        }
      }
    }
    fetchVocabData()
  })

  watch(currentLang, () => {
    fetchVocabData()
  })

  const saveLocalMySets = () => {
    if (import.meta.client) {
      localStorage.setItem('langua_my_vocab_sets', JSON.stringify(localMySets.value))
    }
  }

  // Bộ đề xuất theo ngôn ngữ
  const curatedSets = computed(() => {
    if (!isUseMock.value && dbCuratedSets.value.length > 0) {
      return dbCuratedSets.value
    }
    return CURATED_VOCAB_SETS.filter(s => s.lang === currentLang.value)
  })

  // Bộ của tôi
  const mySets = computed(() => {
    if (!isUseMock.value && authUser.value?.id) {
      return dbMySets.value
    }
    return localMySets.value.filter(s => s.lang === currentLang.value)
  })

  // Quản lý Bộ của tôi (Tạo, Sửa, Xóa)
  const createMySet = async (title: string, description: string, level: string) => {
    const uid = authUser.value?.id

    if (!isUseMock.value && uid) {
      try {
        const { data, error } = await client
          .from('vocab_sets')
          .insert({
            user_id: uid,
            title,
            description,
            language: currentLang.value,
            is_system: false,
            is_public: false,
          })
          .select('*, vocab_words(*)')
          .single()

        if (error) throw error

        if (data) {
          const newSet: VocabSet = {
            id: data.id,
            title: data.title,
            description: data.description || '',
            level,
            lang: currentLang.value,
            isCustom: true,
            createdAt: data.created_at.split('T')[0],
            words: [],
          }
          dbMySets.value.unshift(newSet)
          selectedSetId.value = newSet.id
          return newSet
        }
      } catch (err: any) {
        if (handleAuthExpired(err)) return
        console.warn('Lỗi khi tạo bộ từ trên Supabase:', err.message)
      }
    }

    // Local fallback
    const newSet: VocabSet = {
      id: `custom-set-${Date.now()}`,
      title,
      description,
      level,
      lang: currentLang.value,
      isCustom: true,
      createdAt: new Date().toISOString().split('T')[0],
      words: [],
    }
    localMySets.value.unshift(newSet)
    saveLocalMySets()
    selectedSetId.value = newSet.id
    return newSet
  }

  const updateMySet = async (id: string, title: string, description: string) => {
    const uid = authUser.value?.id

    if (!isUseMock.value && uid && !id.startsWith('custom-set-')) {
      try {
        const { error } = await client
          .from('vocab_sets')
          .update({ title, description })
          .eq('id', id)
          .eq('user_id', uid)

        if (error) throw error
      } catch (err: any) {
        console.warn('Lỗi khi cập nhật bộ từ trên Supabase:', err.message)
      }
    }

    const target = dbMySets.value.find(s => s.id === id) || localMySets.value.find(s => s.id === id)
    if (target) {
      target.title = title
      target.description = description
      saveLocalMySets()
    }
  }

  const deleteMySet = async (id: string) => {
    const uid = authUser.value?.id

    if (!isUseMock.value && uid && !id.startsWith('custom-set-')) {
      try {
        const { error } = await client
          .from('vocab_sets')
          .delete()
          .eq('id', id)
          .eq('user_id', uid)

        if (error) throw error
      } catch (err: any) {
        console.warn('Lỗi khi xóa bộ từ trên Supabase:', err.message)
      }
    }

    dbMySets.value = dbMySets.value.filter(s => s.id !== id)
    localMySets.value = localMySets.value.filter(s => s.id !== id)
    saveLocalMySets()

    if (selectedSetId.value === id) {
      selectedSetId.value = curatedSets.value[0]?.id || ''
    }
  }

  const addWordToMySet = async (setId: string, word: Omit<VocabWord, 'id'>) => {
    const uid = authUser.value?.id

    if (!isUseMock.value && uid && !setId.startsWith('custom-set-')) {
      try {
        const { data, error } = await client
          .from('vocab_words')
          .insert({
            set_id: setId,
            word: word.term,
            phonetic: word.phonetic,
            part_of_speech: word.partOfSpeech,
            meaning_vi: word.meaning,
            example_sentence: word.exampleTarget,
            example_translation: word.exampleMeaning,
          })
          .select()
          .single()

        if (!error && data) {
          const newWord: VocabWord = {
            id: data.id,
            term: data.word,
            phonetic: data.phonetic || '',
            partOfSpeech: data.part_of_speech || 'noun',
            meaning: data.meaning_vi,
            exampleTarget: data.example_sentence || '',
            exampleMeaning: data.example_translation || '',
            srsState: 'new',
          }
          const targetSet = dbMySets.value.find(s => s.id === setId)
          if (targetSet) targetSet.words.push(newWord)
          return newWord
        }
      } catch (err: any) {
        console.warn('Lỗi khi thêm từ vào Supabase:', err.message)
      }
    }

    // Local fallback
    const set = localMySets.value.find(s => s.id === setId) || dbMySets.value.find(s => s.id === setId)
    if (set) {
      const newWord: VocabWord = {
        ...word,
        id: `word-${Date.now()}`,
        srsState: 'new',
      }
      set.words.push(newWord)
      saveLocalMySets()
      return newWord
    }
  }

  const removeWordFromMySet = async (setId: string, wordId: string) => {
    const uid = authUser.value?.id

    if (!isUseMock.value && uid && !wordId.startsWith('word-')) {
      try {
        await client.from('vocab_words').delete().eq('id', wordId)
      } catch (err: any) {
        console.warn('Lỗi khi xóa từ trên Supabase:', err.message)
      }
    }

    const set = dbMySets.value.find(s => s.id === setId) || localMySets.value.find(s => s.id === setId)
    if (set) {
      set.words = set.words.filter(w => w.id !== wordId)
      saveLocalMySets()
    }
  }

  // Lưu từ từ Video, Bài đọc, Từ điển vào bảng user_saved_words
  const saveWordToDatabase = async (
    word: string,
    meaning: string,
    sourceType: 'video' | 'reading' | 'dictionary' | 'typing' | 'grammar' | 'manual',
    sourceRef?: string,
    targetSetId?: string,
    contextSentence?: string
  ) => {
    const uid = authUser.value?.id
    if (!uid) return { success: false, error: 'Chưa đăng nhập' }

    try {
      const { data, error } = await client.from('user_saved_words').upsert(
        {
          user_id: uid,
          word,
          meaning,
          source_type: sourceType,
          source_ref: sourceRef || null,
          target_set_id: targetSetId || null,
          context_sentence: contextSentence || null,
        },
        { onConflict: 'user_id, word, source_type, source_ref' }
      ).select().single()

      if (error) throw error
      return { success: true, data }
    } catch (err: any) {
      return { success: false, error: translateSupabaseError(err) }
    }
  }

  // Tải bản thu âm phát âm lên Storage private bucket 'pronunciation-recordings'
  const uploadPronunciation = async (
    audioBlob: Blob,
    wordText: string,
    wordId?: string
  ) => {
    const uid = authUser.value?.id
    if (!uid) return { success: false, error: 'Chưa đăng nhập' }

    try {
      const fileName = `${uid}/${Date.now()}_${encodeURIComponent(wordText.slice(0, 30))}.webm`

      // 1. Upload vào Storage bucket private
      const { data: uploadData, error: uploadErr } = await client.storage
        .from('pronunciation-recordings')
        .upload(fileName, audioBlob, {
          contentType: 'audio/webm',
          upsert: true,
        })

      if (uploadErr) throw uploadErr

      // 2. Lưu vào bảng pronunciation_recordings
      const { data: recordData, error: recordErr } = await client
        .from('pronunciation_recordings')
        .insert({
          user_id: uid,
          word_id: wordId || null,
          word_text: wordText,
          audio_path: uploadData.path,
        })
        .select()
        .single()

      if (recordErr) throw recordErr

      // 3. Lấy Signed URL để phát lại (thời hạn 1 giờ)
      const { data: signedData, error: signedErr } = await client.storage
        .from('pronunciation-recordings')
        .createSignedUrl(uploadData.path, 3600)

      if (signedErr) throw signedErr

      return {
        success: true,
        recordId: recordData?.id,
        audioUrl: signedData.signedUrl,
      }
    } catch (err: any) {
      return { success: false, error: translateSupabaseError(err) }
    }
  }

  // RPC: Ôn từ lặp lại ngắt quãng SM-2 (review_word)
  const rateWordSrs = async (wordId: string, rating: 'again' | 'hard' | 'good' | 'easy') => {
    const ratingMap: Record<string, number> = {
      again: 1,
      hard: 2,
      good: 3,
      easy: 4,
    }

    if (isUseMock.value || !authUser.value?.id || wordId.startsWith('w-')) {
      return { success: true, srsState: rating }
    }

    try {
      const { data, error } = await client.rpc('review_word', {
        p_word_id: wordId,
        p_rating: ratingMap[rating] || 3,
      })

      if (error) {
        if (handleAuthExpired(error)) return { success: false }
        return { success: false, error: translateSupabaseError(error) }
      }

      return { success: true, data }
    } catch (err: any) {
      return { success: false, error: translateSupabaseError(err) }
    }
  }

  // Lấy bộ từ đang chọn để học
  const selectedSetId = ref<string>('')

  const activeSet = computed<VocabSet>(() => {
    const all = [...curatedSets.value, ...mySets.value]
    if (selectedSetId.value) {
      const found = all.find(s => s.id === selectedSetId.value)
      if (found) return found
    }
    return curatedSets.value[0] || all[0]
  })

  // Thiết lập mặc định khi đổi ngôn ngữ
  watch(currentLang, () => {
    selectedSetId.value = curatedSets.value[0]?.id || ''
  })

  return {
    activeTab,
    curatedSets,
    mySets,
    selectedSetId,
    activeSet,
    isLoading,
    errorMessage,
    fetchVocabData,
    createMySet,
    updateMySet,
    deleteMySet,
    addWordToMySet,
    removeWordFromMySet,
    saveWordToDatabase,
    uploadPronunciation,
    rateWordSrs,
  }
}
