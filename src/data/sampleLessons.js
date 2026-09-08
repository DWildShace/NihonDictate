// src/data/sampleLessons.js
import { KEN_VLOG_FULL_LESSON } from './kenVlogFullLesson.js';

export const SAMPLE_LESSONS = [
  KEN_VLOG_FULL_LESSON,
  {
    id: 'daily_conversation',
    title: 'Hội thoại thường ngày: Mua sắm tại siêu thị tiện lợi (コンビニ)',
    videoId: 'kJQP7kiw5Fk',
    thumbnail: 'https://images.unsplash.com/photo-1528164344705-475426879c0d?w=600&auto=format&fit=crop&q=80',
    description: 'Các mẫu câu phổ biến nhất khi đi mua đồ tại cửa hàng tiện lợi Nhật Bản.',
    sentences: [
      {
        id: 1,
        start: 10.0,
        end: 13.5,
        duration: 3.5,
        text: 'いらっしゃいませ。温めますか？',
        furigana: 'いらっしゃいませ。あたた 温めますか？',
        reading: 'いらっしゃいませあたためますか',
        vietnamese: 'Kính chào quý khách. Quý khách có muốn hâm nóng không ạ?',
        charCount: 14,
      },
      {
        id: 2,
        start: 14.0,
        end: 17.5,
        duration: 3.5,
        text: 'はい、お願いします。',
        furigana: 'はい、お ねが 願いします。',
        reading: 'はいおねがいします',
        vietnamese: 'Vâng, xin phiền bạn.',
        charCount: 9,
      },
      {
        id: 3,
        start: 18.0,
        end: 22.0,
        duration: 4.0,
        text: 'ポイントカードはお持ちですか？',
        furigana: 'ポイントカード は お も 持ちですか？',
        reading: 'ぽいんとかーどはおもちですか',
        vietnamese: 'Quý khách có thẻ tích điểm không ạ?',
        charCount: 14,
      },
      {
        id: 4,
        start: 22.5,
        end: 26.5,
        duration: 4.0,
        text: '持っていません。袋も大丈夫です。',
        furigana: 'も 持っていません。ふくろ 袋 も だいじょうぶ 大丈夫です。',
        reading: 'もっていませんふくろもだいじょうぶです',
        vietnamese: 'Tôi không có. Túi nilon cũng không cần đâu ạ.',
        charCount: 15,
      },
    ],
  },
];
