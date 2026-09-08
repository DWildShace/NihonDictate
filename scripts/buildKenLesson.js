// scripts/buildKenLesson.js
import fs from 'fs';
import { sanitizeRelativeTimestamps } from '../src/utils/relativeTimestamps.js';

const rawList = JSON.parse(fs.readFileSync('server/sample_raw_transcript.json', 'utf-8'));

// 1. Tách các câu từ rawList
const splittedList = [];
for (const item of rawList) {
  const rawText = (item.text || '').replace(/\s+/g, ' ').trim();
  if (!rawText) continue;
  const start = item.offset / 1000;
  const duration = item.duration / 1000;
  const end = start + duration;

  if (rawText.includes('。')) {
    const parts = rawText.split(/(?<=。)/g).map(s => s.trim()).filter(Boolean);
    if (parts.length > 1) {
      const totalLen = parts.reduce((acc, p) => acc + p.length, 0);
      let curStart = start;
      for (let i = 0; i < parts.length; i++) {
        const p = parts[i];
        const pDur = (p.length / totalLen) * duration;
        const pEnd = i === parts.length - 1 ? end : curStart + pDur;
        splittedList.push({
          text: p,
          start: curStart,
          end: pEnd,
          duration: pEnd - curStart,
        });
        curStart = pEnd;
      }
      continue;
    }
  }
  splittedList.push({
    text: rawText,
    start,
    end,
    duration,
  });
}

// Giữ mốc thời gian tự nhiên nguyên bản trong file dữ liệu gốc
const sanitized = splittedList.map((cur, i) => {
  const curStart = parseFloat(Number(cur.start || 0).toFixed(2));
  let curEnd = parseFloat(Number(cur.end || 0).toFixed(2));
  if (i < splittedList.length - 1) {
    const nextStart = parseFloat(Number(splittedList[i + 1].start || 0).toFixed(2));
    if (curEnd > nextStart) {
      curEnd = nextStart;
    }
  }
  return {
    ...cur,
    start: curStart,
    end: curEnd,
    duration: parseFloat((curEnd - curStart).toFixed(2)),
  };
});

// 2. Bảng dữ liệu dịch nghĩa tiếng Việt & Phiên âm Hiragana chuẩn xác cho 153 câu
const SENTENCE_DETAILS = [
  {
    text: "みなさん、こんにちは！ Kenです！",
    furigana: "みなさん、こんにちは！ Ken です！",
    reading: "みなさんこんにちはけんです",
    vietnamese: "Xin chào mọi người! Mình là Ken!"
  },
  {
    text: "今日は暑いです。",
    furigana: "きょう 今日 は あつ 暑いです。",
    reading: "きょうはあついです",
    vietnamese: "Hôm nay trời nóng quá."
  },
  {
    text: "本当に暑いです。",
    furigana: "ほんとう 本当 に あつ 暑いです。",
    reading: "ほんとうにあついです",
    vietnamese: "Thực sự rất là nóng."
  },
  {
    text: "いい天気ですけどね。",
    furigana: "いい てんき 天気 ですけどね。",
    reading: "いいてんきですけどね",
    vietnamese: "Nhưng mà thời tiết rất đẹp nhỉ."
  },
  {
    text: "今、３５℃（９５F）ぐらいあります。",
    furigana: "いま 今、35ど 35℃（95F）ぐらい あります。",
    reading: "いまさんじゅうごどぐらいあります",
    vietnamese: "Bây giờ đang khoảng 35 độ C (95 độ F)."
  },
  {
    text: "暑いです。",
    furigana: "あつ 暑いです。",
    reading: "あついです",
    vietnamese: "Nóng thật đấy."
  },
  {
    text: "あの〜... 今日は暑いので、",
    furigana: "あの〜... きょう 今日 は あつ 暑いので、",
    reading: "あのきょうはあついので",
    vietnamese: "À thì... vì hôm nay trời nóng,"
  },
  {
    text: "みなさん、一緒にアイスクリームを食べに行きませんか？",
    furigana: "みなさん、いっしょ 一緒 に アイスクリーム を た 食べ に いき 行きませんか？",
    reading: "みなさんいっしょにあいすくりーむをたべにいきませんか",
    vietnamese: "Mọi người có muốn cùng mình đi ăn kem không?"
  },
  {
    text: "今日は僕の家族も一緒に行くと思います。",
    furigana: "きょう 今日 は ぼく 僕 の かぞく 家族 も いっしょ 一緒 に い 行く と おも 思います。",
    reading: "きょうはぼくのかぞくもいっしょにいくとおもいます",
    vietnamese: "Hôm nay tôi nghĩ gia đình tôi cũng sẽ đi cùng."
  },
  {
    text: "僕のお母さんが「アイスクリーム食べたいね」って言い始めました。",
    furigana: "ぼく 僕 の おかあ お母さんが「アイスクリーム た 食べたいね」って い 言い はじ 始めました。",
    reading: "ぼくのおかあさんがあいすくりーむたべたいねといいはじめました",
    vietnamese: "Mẹ tôi bắt đầu bảo là 'Muốn ăn kem quá nhỉ'."
  },
  {
    text: "だから、家族みんなで今から行きます。",
    furigana: "だから、かぞく 家族 みんな で いま 今 から い 行きます。",
    reading: "だからかぞくみんなでいまからいきます",
    vietnamese: "Thế nên cả nhà tôi chuẩn bị đi bây giờ đây."
  },
  {
    text: "皆さんも一緒に行きましょう！",
    furigana: "みな 皆さんも いっしょ 一緒 に い 行きましょう！",
    reading: "みなさんもいっしょにいきましょう",
    vietnamese: "Mọi người cũng cùng đi nhé!"
  },
  {
    text: "僕は今、家族を待っています。",
    furigana: "ぼく 僕 は いま 今、かぞく 家族 を ま 待っています。",
    reading: "ぼくはいまかぞくをまっています",
    vietnamese: "Tôi hiện đang đợi gia đình."
  },
  {
    text: "僕のお母さんはもうちょっと準備に時間がかかるみたいです。",
    furigana: "ぼく 僕 の おかあ お母さんは もうちょっと じゅんび 準備 に じかん 時間 が かかるみたいです。",
    reading: "ぼくのおかあさんはもうちょっとじゅんびにじかんがかかるみたいです",
    vietnamese: "Có vẻ mẹ tôi cần thêm một chút thời gian để chuẩn bị."
  },
  {
    text: "あ、やばい、暑い。",
    furigana: "あ、やばい、あつ 暑い。",
    reading: "あやばいあつい",
    vietnamese: "A, gay thật, nóng quá."
  },
  {
    text: "今日は日差しが強いです。",
    furigana: "きょう 今日 は ひざ 日差し が つよ 強いです。",
    reading: "きょうはひざしがつよいです",
    vietnamese: "Hôm nay ánh nắng gay gắt thật."
  },
  {
    text: "たぶん帽子をかぶったほうがいいですね。",
    furigana: "たぶん ぼうし 帽子 を かぶったほうが いいですね。",
    reading: "たぶんぼうしをかぶったほうがいいですね",
    vietnamese: "Có lẽ nên đội mũ thì hơn nhỉ."
  },
  {
    text: "ちょっと日陰に行きましょう。",
    furigana: "ちょっと ひかげ 日陰 に い 行きましょう。",
    reading: "ちょっとひかげにいきましょう",
    vietnamese: "Chúng ta hãy đi vào bóng râm một chút nào."
  },
  {
    text: "今、日陰の場所に来ました。",
    furigana: "いま 今、ひかげ 日陰 の ばしょ 場所 に き 来ました。",
    reading: "いまひかげのばしょにきました",
    vietnamese: "Bây giờ tôi đã đến chỗ râm mát rồi."
  },
  {
    text: "ここはね、大丈夫です。",
    furigana: "ここ はね、だいじょうぶ 大丈夫です。",
    reading: "ここはねだいじょうぶです",
    vietnamese: "Ở đây thì ổn rồi."
  },
  {
    text: "まだ暑いけど、まあ... 暑すぎないですね。",
    furigana: "まだ あつ 暑いけど、まあ... あつ 暑すぎないですね。",
    reading: "まだあついけどまああつすぎないですね",
    vietnamese: "Vẫn nóng nhưng mà... không đến mức quá nóng."
  },
  {
    text: "さっきは暑かったです。",
    furigana: "さっき は あつ 暑かったです。",
    reading: "さっきはあつかったです",
    vietnamese: "Lúc nãy thì nóng thật sự."
  },
  {
    text: "この人も行きたがっているので、一緒に連れて行きます。",
    furigana: "この ひと 人 も い 行きたがっているので、いっしょ 一緒 に つ 連れて い 行きます。",
    reading: "このひともいきたがっているのでいっしょにつれていきます",
    vietnamese: "Người này cũng muốn đi nên tôi sẽ dẫn đi cùng."
  },
  {
    text: "めっちゃ行きたがってますね。",
    furigana: "めっちゃ い 行きたがってますね。",
    reading: "めっちゃいきたがってますね",
    vietnamese: "Rất là muốn đi luôn đấy nhỉ."
  },
  {
    text: "今、車を運転しています。",
    furigana: "いま 今、くるま 車 を うんてん 運転しています。",
    reading: "いまくるまをうんてんしています",
    vietnamese: "Bây giờ tôi đang lái xe."
  },
  {
    text: "今、僕のお母さんがカメラを持ってくれています。",
    furigana: "いま 今、ぼく 僕 の おかあ お母さんが カメラ を も 持ってくれています。",
    reading: "いまぼくのおかあさんがかめらをもってくれています",
    vietnamese: "Hiện tại mẹ tôi đang cầm máy quay giúp tôi."
  },
  {
    text: "今日は天気がいいから、運転するのも気持ちがいいですね。",
    furigana: "きょう 今日 は てんき 天気が いいから、うんてん 運転するのも きも 気持ちが いいですね。",
    reading: "きょうはてんきがいいからうんてんするのもきもちがいいですね",
    vietnamese: "Hôm nay thời tiết đẹp nên lái xe cũng thấy rất dễ chịu."
  },
  {
    text: "この辺は田舎ですよ。",
    furigana: "この へん 辺 は いなか 田舎ですよ。",
    reading: "このへんはいなかですよ",
    vietnamese: "Khu vực quanh đây là vùng quê đấy."
  },
  {
    text: "夏だから、緑がたくさんあります。",
    furigana: "なつ 夏 だから、みどり 緑 が たくさん あります。",
    reading: "なつだからみどりがたくさんあります",
    vietnamese: "Vì là mùa hè nên có rất nhiều cây xanh."
  },
  {
    text: "皆さん、見えるでしょう？景色がちょっと見えるでしょう？",
    furigana: "みな 皆さん、み 見えるでしょう？ けしき 景色が ちょっと み 見えるでしょう？",
    reading: "みなさんみえるでしょうけしきがちょっとみえるでしょう",
    vietnamese: "Mọi người thấy chứ? Nhìn thấy một chút phong cảnh rồi đúng không?"
  },
  {
    text: "緑です。",
    furigana: "みどり 緑 です。",
    reading: "みどりです",
    vietnamese: "Toàn là màu xanh lá."
  },
  {
    text: "全部、緑です。",
    furigana: "ぜんぶ 全部、みどり 緑 です。",
    reading: "ぜんぶみどりです",
    vietnamese: "Tất cả đều là màu xanh lá."
  },
  {
    text: "全部、緑だから、目に優しいですね。",
    furigana: "ぜんぶ 全部、みどり 緑 だから、め 目 に やさ 優しいですね。",
    reading: "ぜんぶみどりだからめにやさしいですね",
    vietnamese: "Vì toàn màu xanh nên rất dịu cho mắt nhỉ."
  },
  {
    text: "たぶん目が良くなりますよ。",
    furigana: "たぶん め 目 が よ 良く なりますよ。",
    reading: "たぶんめがよくなりますよ",
    vietnamese: "Có khi mắt lại sáng ra đấy."
  },
  {
    text: "すごい！ 緑のトンネル！",
    furigana: "すごい！ みどり 緑 の トンネル！",
    reading: "すごいみどりのとんねる",
    vietnamese: "Tuyệt quá! Đường hầm cây xanh!"
  },
  {
    text: "あっちに緑のトンネルがあります。",
    furigana: "あっち に みどり 緑 の トンネル が あります。",
    reading: "あっちにみどりのとんねるがあります",
    vietnamese: "Đằng kia có một con đường hầm cây xanh mát."
  },
  {
    text: "すごいよ、これ！",
    furigana: "すごいよ、これ！",
    reading: "すごいよこれ",
    vietnamese: "Cái này đỉnh thật đấy!"
  },
  {
    text: "ここからアイスクリームのお店まで、もうちょっと時間がかかります。",
    furigana: "ここ から アイスクリーム の おみせ お店 まで、もうちょっと じかん 時間 が かかります。",
    reading: "ここからあいすくりーむのおみせまでもうちょっとじかんがかかります",
    vietnamese: "Từ đây tới tiệm kem sẽ mất thêm một chút thời gian nữa."
  },
  {
    text: "僕はそのお店の近くまでは行ったことがあるんですけど、",
    furigana: "ぼく 僕 は その おみせ お店の ちか 近く までは い 行ったことが あるんですけど、",
    reading: "ぼくはそのおみせのちかくまではいったことがあるんですけど",
    vietnamese: "Tôi từng đến gần tiệm đó rồi nhưng mà,"
  },
  {
    text: "そのお店は行ったことがないです。",
    furigana: "その おみせ お店 は い 行ったことが ないです。",
    reading: "そのおみせはいったことがないです",
    vietnamese: "Bản thân tiệm đó thì tôi chưa vào bao giờ."
  },
  {
    text: "お母さんが調べてきて、「ここに行きたい」ってリクエストされました。",
    furigana: "おかあ お母さんが しら 調べてきて、「ここ に い 行きたい」って リクエスト されました。",
    reading: "おかあさんがしらべてきてここにいきたいとりくえすとされました",
    vietnamese: "Mẹ tôi đã tìm hiểu và yêu cầu: 'Mẹ muốn đến chỗ này'."
  },
  {
    text: "今、お母さん、隣で笑ってますよ。",
    furigana: "いま 今、おかあ お母さん、となり 隣 で わら 笑ってますよ。",
    reading: "いまおかあさんとなりでわらってますよ",
    vietnamese: "Bây giờ mẹ đang ngồi bên cạnh cười kìa."
  },
  {
    text: "リクエストした人が笑ってます。",
    furigana: "リクエスト した ひと 人 が わら 笑ってます。",
    reading: "りくえすとしたひとがわらってます",
    vietnamese: "Người đưa ra yêu cầu đang cười tươi."
  },
  {
    text: "お母さん、今日の場所、行ったことある？ ないです。",
    furigana: "おかあ お母さん、きょう 今日 の ばしょ 場所、い 行ったこと ある？ ないです。",
    reading: "おかあさんきょうのばしょいったことあるないです",
    vietnamese: "Mẹ ơi, chỗ hôm nay mẹ đã từng đến chưa? Chưa ạ."
  },
  {
    text: "みんな初めて。",
    furigana: "みんな はじ 初めて。",
    reading: "みんなはじめて",
    vietnamese: "Tất cả mọi người đều là lần đầu tiên."
  },
  {
    text: "楽しみ！",
    furigana: "たの 楽しみ！",
    reading: "たのしみ",
    vietnamese: "Háo hức quá!"
  },
  {
    text: "この辺は街ですけど、向こうの方に山が見えますね。",
    furigana: "この へん 辺 は まち 街 ですけど、む 向こう の ほう 方 に やま 山 が み 見えますね。",
    reading: "このへんはまちですけどむこうのほうにやまがみえますね",
    vietnamese: "Quanh đây là phố thị, nhưng phía đằng xa có thể nhìn thấy núi nhỉ."
  },
  {
    text: "大きい山が見えます。",
    furigana: "おお 大きい やま 山 が み 見えます。",
    reading: "おおきいやまがみえます",
    vietnamese: "Nhìn thấy ngọn núi to lớn."
  },
  {
    text: "すごい緑できれい！",
    furigana: "すごい みどり 緑 で きれい！",
    reading: "すごいみどりできれい",
    vietnamese: "Xanh mướt và đẹp quá!"
  },
  {
    text: "近くの駐車場に着きました。",
    furigana: "ちか 近く の ちゅうしゃじょう 駐車場 に つ 着きました。",
    reading: "ちかくのちゅうしゃじょうにつきました",
    vietnamese: "Đã đến bãi đỗ xe gần đó rồi."
  },
  {
    text: "じゃあ、行ってみましょう！",
    furigana: "じゃあ、い 行ってみましょう！",
    reading: "じゃあ行ってみましょう",
    reading: "じゃあいってみましょう",
    vietnamese: "Vậy thì cùng đi nào!"
  },
  {
    text: "この辺ですね。",
    furigana: "この へん 辺 ですね。",
    reading: "このへんですね",
    vietnamese: "Là quanh khu này nhỉ."
  },
  {
    text: "えっと... いや〜、暑いね。",
    furigana: "えっと... いや〜、あつ 暑いね。",
    reading: "えっといやあついね",
    vietnamese: "À thì... chà, nóng thật đấy."
  },
  {
    text: "今日はアイスクリーム日和ですよ。",
    furigana: "きょう 今日 は アイスクリーム びより 日和 ですよ。",
    reading: "きょうはあいすくりーむびよりですよ",
    vietnamese: "Hôm nay đúng là ngày lý tưởng để ăn kem."
  },
  {
    text: "その「日和」の意味はそれに一番いい日っていう意味です。",
    furigana: "その「びより 日和」の いみ 意味 は それ に いちばん 一番 いい ひ 日 っていう いみ 意味 です。",
    reading: "そのびよりのいみはそれにいちばんいいひといういみです",
    vietnamese: "Từ 'Hiyori' có nghĩa là ngày thích hợp nhất cho việc đó."
  },
  {
    text: "アイスクリーム日和。",
    furigana: "アイスクリーム びより 日和。",
    reading: "あいすくりーむびより",
    vietnamese: "Ngày lý tưởng cho món kem."
  },
  {
    text: "今日はアイスクリームを食べるのに一番いいっていう日ですね。",
    furigana: "きょう 今日 は アイスクリーム を た 食べる の に いちばん 一番 いいっていう ひ 日 ですね。",
    reading: "きょうはあいすくりーむをたべるのにいちばんいいというひですね",
    vietnamese: "Hôm nay chính là ngày tuyệt nhất để ăn kem nhỉ."
  },
  {
    text: "この辺だと思うんですけど、ないですね。",
    furigana: "この へん 辺 だと おも 思うんですけど、ないですね。",
    reading: "このへんだとおもうんですけどないですね",
    vietnamese: "Mình nghĩ là quanh đây mà không thấy nhỉ."
  },
  {
    text: "ちょっと道に迷いました。",
    furigana: "ちょっと みち 道 に まよ 迷いました。",
    reading: "ちょっとみちにまよいました",
    vietnamese: "Hơi lạc đường một chút rồi."
  },
  {
    text: "あ？ ん？ 休み？ 休みか？！ えぇ! 休みですね。",
    furigana: "あ？ ん？ やす 休み？ やす 休みか？！ えぇ! やす 休みですね。",
    reading: "あんやすみやすみかええやすみですね",
    vietnamese: "Hả? Ủa? Nghỉ? Nghỉ sao?! Ối! Nghỉ thật rồi."
  },
  {
    text: "うわ、残念！ 休み。",
    furigana: "うわ、ざんねん 残念！ やす 休み。",
    reading: "うわざんねんやすみ",
    vietnamese: "Oa, tiếc quá! Đóng cửa rồi."
  },
  {
    text: "えー！ 休みですよ。",
    furigana: "えー！ やす 休みですよ。",
    reading: "えーやすみですよ",
    vietnamese: "Trời ơi! Quán nghỉ mất rồi."
  },
  {
    text: "ここに今日は休みって書いてあります。",
    furigana: "ここ に きょう 今日 は やす 休み って か 書いてあります。",
    reading: "ここにきょうはやすみとかいてあります",
    vietnamese: "Ở đây có ghi hôm nay nghỉ này."
  },
  {
    text: "あ〜、残念ですね。",
    furigana: "あ〜、ざんねん 残念ですね。",
    reading: "あーざんねんですね",
    vietnamese: "A~, tiếc thật nhỉ."
  },
  {
    text: "休みかぁ〜！ 残念。",
    furigana: "やす 休みかぁ〜！ ざんねん 残念。",
    reading: "やすみかあざんねん",
    vietnamese: "Nghỉ bán sao trời! Tiếc ghê."
  },
  {
    text: "僕の家族は今あっちの方にいます。",
    furigana: "ぼく 僕 の かぞく 家族 は いま 今 あっち の ほう 方 に います。",
    reading: "ぼくのかぞくはいまあっちのほうにいます",
    vietnamese: "Gia đình tôi hiện đang ở phía đằng kia."
  },
  {
    text: "隣にスーパーがあって、そのスーパーを見に行きました。",
    furigana: "となり 隣 に スーパー が あって、その スーパー を み 見に い 行きました。",
    reading: "となりにすーぱーがあってそのすーぱーをみにいきました",
    vietnamese: "Bên cạnh có một siêu thị và mọi người đã sang ngó thử."
  },
  {
    text: "うわぁ、残念。",
    furigana: "うわぁ、ざんねん 残念。",
    reading: "うわあざんねん",
    vietnamese: "Uầy, tiếc thật."
  },
  {
    text: "まぁ、休みはしょうがないですね。",
    furigana: "まぁ、やす 休み は しょうがないですね。",
    reading: "まあやすみはしょうがないですね",
    vietnamese: "Mà thôi, quán nghỉ thì đành chịu thôi."
  },
  {
    text: "僕のお母さんは「今日休み」って聞いたら、残念な気持ちになると思います。",
    furigana: "ぼく 僕 の おかあ お母さんは「きょう 今日 やす 休み」って き 聞いたら、ざんねん 残念な きも 気持ち に なると おも 思います。",
    reading: "ぼくのおかあさんはきょうやすみときいたらざんねんなきもちになるとおもいます",
    vietnamese: "Tôi nghĩ nếu mẹ nghe tin hôm nay nghỉ thì sẽ buồn lắm."
  },
  {
    text: "まあ... まあね、大丈夫ですよ。",
    furigana: "まあ... まあね、だいじょうぶ 大丈夫ですよ。",
    reading: "まあまあねだいじょうぶですよ",
    vietnamese: "Mà... mà không sao đâu."
  },
  {
    text: "たぶん他にもアイスクリームのお店があると思います。",
    furigana: "たぶん ほか 他 にも アイスクリーム の おみせ お店 が あると おも 思います。",
    reading: "たぶんほかにもあいすくりーむのおみせがあるとおもいます",
    vietnamese: "Chắc là vẫn còn những tiệm kem khác nữa."
  },
  {
    text: "ちょっと探してみますね。",
    furigana: "ちょっと さが 探してみますね。",
    reading: "ちょっとさがしてみますね",
    vietnamese: "Để tôi thử tìm quanh xem sao nhé."
  },
  {
    text: "残念、残念。",
    furigana: "ざんねん 残念、ざんねん 残念。",
    reading: "ざんねんざんねん",
    vietnamese: "Tiếc thật, tiếc ghê."
  },
  {
    text: "今、僕のお母さんに言いました。",
    furigana: "いま 今、ぼく 僕 の おかあ お母さん に い 言いました。",
    reading: "いまぼくのおかあさんにいいました",
    vietnamese: "Tôi vừa nói cho mẹ biết rồi."
  },
  {
    text: "「今日休みだよ」って言いました。",
    furigana: "「きょう 今日 やす 休みだよ」って い 言いました。",
    reading: "きょうやすみだよといいました",
    vietnamese: "Tôi bảo: 'Hôm nay quán nghỉ mẹ ơi'."
  },
  {
    text: "そしたら、めっちゃびっくりしてました。",
    furigana: "そしたら、めっちゃ びっくり してました。",
    reading: "そしたらめっちゃびっくりしてました",
    vietnamese: "Thế là mẹ ngạc nhiên tột độ luôn."
  },
  {
    text: "で、僕のお母さんはどうしてもどうしてもあのお店のアイスクリームが食べたいみたいです。",
    furigana: "で、ぼく 僕 の おかあ お母さんは どうしても どうしても あの おみせ お店の アイスクリーム が た 食べたいみたいです。",
    reading: "でぼくのおかあさんはどうしてもどうしてもあのおみせのあいすくりーむがたべたいみたいです",
    vietnamese: "Và mẹ tôi thì nhất quyết, bằng mọi giá muốn ăn kem của tiệm đó."
  },
  {
    text: "だから、僕たちは決めました。",
    furigana: "だから、ぼく 僕たち は き 決めました。",
    reading: "だからぼくたちはきめました",
    vietnamese: "Vì thế, cả nhà tôi đã đưa ra quyết định."
  },
  {
    text: "明日またここに来ることにしました。",
    furigana: "あした 明日 また ここ に く 来る こと に しました。",
    reading: "あしたまたここにくることにしました",
    vietnamese: "Quyết định mai sẽ quay lại đây lần nữa."
  },
  {
    text: "明日またリベンジします。",
    furigana: "あした 明日 また リベンジ します。",
    reading: "あしたまたりべんじします",
    vietnamese: "Ngày mai sẽ 'phục thù'."
  },
  {
    text: "明日もお店休みかもしれないです。",
    furigana: "あした 明日 も おみせ お店 やす 休み かもしれないです。",
    reading: "あしたもおみせやすみかもしれないです",
    vietnamese: "Ngày mai có khi quán cũng nghỉ không chừng."
  },
  {
    text: "明日お店がやってるかどうか分かりません。",
    furigana: "あした 明日 おみせ お店 が やってる かどうか わか 分かりません。",
    reading: "あしたおみせがやってるかどうかわかりません",
    vietnamese: "Tôi không rõ mai quán có mở cửa hay không."
  },
  {
    text: "でも、明日また来てみます。",
    furigana: "でも、あした 明日 また き 来てみます。",
    reading: "でもあしたまたきてみます",
    vietnamese: "Nhưng mai tôi vẫn sẽ thử quay lại xem sao."
  },
  {
    text: "明日また皆さん一緒に来ましょう！",
    furigana: "あした 明日 また みな 皆さん いっしょ 一緒 に き 来ましょう！",
    reading: "あしたまたみなさんいっしょにきましょう",
    vietnamese: "Ngày mai mọi người lại cùng đi với mình nhé!"
  },
  {
    text: "じゃあまた明日！",
    furigana: "じゃあ また あした 明日！",
    reading: "じゃあまたあした",
    vietnamese: "Vậy hẹn gặp lại ngày mai nha!"
  },
  {
    text: "みなさん、おはようございます！ 今日は日曜日です。",
    furigana: "みなさん、おはようございます！ きょう 今日 は にちようび 日曜日 です。",
    reading: "みなさんおはようございますきょうはにちようびです",
    vietnamese: "Chào buổi sáng mọi người! Hôm nay là Chủ Nhật."
  },
  {
    text: "僕は日曜日が休みです。",
    furigana: "ぼく 僕 は にちようび 日曜日 が やす 休みです。",
    reading: "ぼくはにちようびがやすみです",
    vietnamese: "Tôi được nghỉ vào Chủ Nhật."
  },
  {
    text: "今日は仕事がないですよ。",
    furigana: "きょう 今日 は しごと 仕事 が ないですよ。",
    reading: "きょうはしごとがないですよ",
    vietnamese: "Hôm nay tôi không phải đi làm."
  },
  {
    text: "だからゆっくりしています。",
    furigana: "だから ゆっくり しています。",
    reading: "だからゆっくりしています",
    vietnamese: "Thế nên tôi đang thư thả nghỉ ngơi."
  },
  {
    text: "昨日、僕たちはアイスクリームのお店に行ったんですけど、",
    furigana: "きのう 昨日、ぼく 僕たち は アイスクリーム の おみせ お店 に い 行ったんですけど、",
    reading: "きのうぼくたちはあいすくりーむのおみせにいったんですけど",
    vietnamese: "Hôm qua chúng tôi có đến tiệm kem nhưng,"
  },
  {
    text: "お店が休みで、アイスクリーム買えませんでした。",
    furigana: "おみせ お店 が やす 休みで、アイスクリーム か 買えませんでした。",
    reading: "おみせがやすみであいすくりーむかえませんでした",
    vietnamese: "Quán nghỉ nên không mua được kem."
  },
  {
    text: "残念。",
    furigana: "ざんねん 残念。",
    reading: "ざんねん",
    vietnamese: "Đáng tiếc thật."
  },
  {
    text: "えっと、まあ、グーグルマップを見たら、",
    furigana: "えっと、まあ、グーグルマップ を み 見たら、",
    reading: "えっとまあぐーぐるまっぷをみたら",
    vietnamese: "Ừm, mà khi tra Google Maps thì,"
  },
  {
    text: "そのお店は今日もやっているみたいです。",
    furigana: "その おみせ お店 は きょう 今日 も やっているみたいです。",
    reading: "そのおみせはきょうもやっているみたいです",
    vietnamese: "Có vẻ quán đó hôm nay vẫn mở cửa."
  },
  {
    text: "なんか... 土曜日と日曜日は本当はやっているみたいです。",
    furigana: "なんか... どようび 土曜日 と にちようび 日曜日 は ほんとう 本当 は やっているみたいです。",
    reading: "なんかどようびとにちようびはほんとうはやってるみたいです",
    vietnamese: "Nghe nói... Thứ Bảy và Chủ Nhật thực ra quán vẫn mở."
  },
  {
    text: "昨日は たぶん たまたま休みだったと思います。",
    furigana: "きのう 昨日 は たぶん たまたま やす 休みだったと おも 思います。",
    reading: "きのうはたぶんたまたまやすみだったとおもいます",
    vietnamese: "Hôm qua chắc tình cờ quán nghỉ đột xuất thôi."
  },
  {
    text: "なので、この後、みんなで行ってみようと思います。",
    furigana: "なので、この あと 後、みんな で い 行ってみようと おも 思います。",
    reading: "なのでこのあとみんなでいってみようとおもいます",
    vietnamese: "Vì thế lát nữa cả nhà sẽ cùng đi thử xem."
  },
  {
    text: "今日はお店がやってるといいですね。",
    furigana: "きょう 今日 は おみせ お店 が やってると いいですね。",
    reading: "きょうはおみせがやってるといいですね",
    vietnamese: "Mong là hôm nay quán mở cửa nhỉ."
  },
  {
    text: "やってなかったら、どうしましょう？",
    furigana: "やってなかったら、どうしましょう？",
    reading: "やってなかったらどうしましょう",
    vietnamese: "Nếu không mở thì tính sao ta?"
  },
  {
    text: "まあ、それはその時また考えます。",
    furigana: "まあ、それ は その とき 時 また かんが 考えます。",
    reading: "まあそれはそのときまたかんがえます",
    vietnamese: "Thôi thì lúc đó rồi tính tiếp."
  },
  {
    text: "じゃあ、準備していきましょうね！",
    furigana: "じゃあ、じゅんび 準備 して いきましょうね！",
    reading: "じゃあじゅんびしていきましょうね",
    vietnamese: "Nào, chuẩn bị rồi lên đường thôi!"
  },
  {
    text: "今日もやってるかどうかわからないけど、やってたら、いいですね！",
    furigana: "きょう 今日 も やってるか どうか わからないけど、やってたら、いいですね！",
    reading: "きょうもやってるかどうかわからないけどやってたらいいですね",
    vietnamese: "Hôm nay cũng chưa biết có mở không nhưng nếu mở thì tuyệt quá!"
  },
  {
    text: "じゃあ、皆さん、行きましょう！",
    furigana: "じゃあ、みな 皆さん、い 行きましょう！",
    reading: "じゃあみなさんいきましょう",
    vietnamese: "Nào mọi người ơi, đi thôi!"
  },
  {
    text: "やってるかな？ 楽しみですね！",
    furigana: "やってるかな？ たの 楽しみですね！",
    reading: "やってるかなたのしみですね",
    vietnamese: "Không biết có mở không ta? Háo hức ghê!"
  },
  {
    text: "やってる、やってる！ やってるよ！",
    furigana: "やってる、やってる！ やってるよ！",
    reading: "やってるやってるやってるよ",
    vietnamese: "Mở rồi, mở rồi! Mở cửa rồi nha!"
  },
  {
    text: "なんか、今、聞いたらアイスクリームは売り切れみたいです。",
    furigana: "なんか、いま 今、き 聞いたら アイスクリーム は う 売りき 切れみたいです。",
    reading: "なんかいまきいたらあいすくりーむはうりきれみたいです",
    vietnamese: "Hình như vừa hỏi thì kem đã bán hết sạch rồi."
  },
  {
    text: "昨日も来たんですけど。",
    furigana: "きのう 昨日 も き 来たんですけど。",
    reading: "きのうもきたんですけど",
    vietnamese: "Hôm qua cháu cũng có ghé qua."
  },
  {
    text: "昨日来て、張り紙してありませんでしたか？ ありました。",
    furigana: "きのう 昨日 き 来て、は 張りがみ 紙 してありませんでしたか？ ありました。",
    reading: "きのうきてはりがみしてありませんでしたかありました",
    vietnamese: "Hôm qua cháu tới, có dán thông báo không ạ? Dạ có ạ."
  },
  {
    text: "ありがとうございます！ いただきます！ なんかもらいました！",
    furigana: "ありがとうございます！ いただきます！ なんか もらいました！",
    reading: "ありがとうございますいただきますなんかもらいました",
    vietnamese: "Cháu cảm ơn ạ! Xin phép được thưởng thức! Được tặng quà này!"
  },
  {
    text: "試食だそうです。",
    furigana: "ししょく 試食 だそうです。",
    reading: "ししょくだそうです",
    vietnamese: "Nghe bảo là đồ ăn thử miễn phí đấy."
  },
  {
    text: "おいしい！",
    furigana: "おいしい！",
    reading: "おいしい",
    vietnamese: "Ngon quá!"
  },
  {
    text: "アイスクリームが売り切れだから、試食をもらいました。",
    furigana: "アイスクリーム が う 売りき 切れ だから、ししょく 試食 を もらいました。",
    reading: "あいすくりーむがうりきれだからししょくをもらいました",
    vietnamese: "Vì kem đã hết nên được tặng bánh ăn thử."
  },
  {
    text: "おいしいですよ。",
    furigana: "おいしいですよ。",
    reading: "おいしいですよ",
    vietnamese: "Ngon lắm mọi người ơi."
  },
  {
    text: "すいません、今、YouTubeの動画を撮ってたんですけど、",
    furigana: "すいません、いま 今、YouTube の どうが 動画 を と 撮ってたんですけど、",
    reading: "すいませんいまゆーちゅーぶのどうがをとってたんですけど",
    vietnamese: "Dạ xin lỗi, cháu đang quay video cho YouTube ạ,"
  },
  {
    text: "お店も撮ってもいいですか？",
    furigana: "おみせ お店 も と 撮っても いいですか？",
    reading: "おみせもとってもいいですか",
    vietnamese: "Cháu có thể quay quán được không ạ?"
  },
  {
    text: "大丈夫です。",
    furigana: "だいじょうぶ 大丈夫です。",
    reading: "だいじょうぶです",
    vietnamese: "Được chứ, không sao đâu."
  },
  {
    text: "ありがとうございます。",
    furigana: "ありがとうございます。",
    reading: "ありがとうございます",
    vietnamese: "Dạ cháu cảm ơn nhiều ạ."
  },
  {
    text: "これも試食もらいました。",
    furigana: "これ も ししょく 試食 もらいました。",
    reading: "これもししょくもらいました",
    vietnamese: "Món này cũng được cho ăn thử nữa này."
  },
  {
    text: "もう一つのお菓子、試食してみます。",
    furigana: "もう ひと 一つ の おかし お菓子、ししょく 試食 してみます。",
    reading: "もうひとつのおかしししょくしてみます",
    vietnamese: "Tôi sẽ ăn thử một loại bánh ngọt khác nữa."
  },
  {
    text: "これ、おいしいよ！",
    furigana: "これ、おいしいよ！",
    reading: "これおいしいよ",
    vietnamese: "Cái này ngon tuyệt vời luôn!"
  },
  {
    text: "これ、お父さんにお土産を買っていったら、いいかな？",
    furigana: "これ、おとう お父さん に おみやげ お土産 を か 買っていったら、いいかな？",
    reading: "これおとうさんにおみやげをかっていったらいいかな",
    vietnamese: "Mua cái này về làm quà cho bố có ổn không nhỉ?"
  },
  {
    text: "フィナンシェ３つとカヌレ２つ、お願いします。",
    furigana: "フィナンシェ 3つ と カヌレ 2つ、おねが お願いします。",
    reading: "ふぃなんしぇみっつとかぬれふたつおねがいします",
    vietnamese: "Lấy giúp cháu 3 chiếc financier và 2 chiếc canelé nhé ạ."
  },
  {
    text: "僕のお母さんがヤギのおやつを買いました。",
    furigana: "ぼく 僕 の おかあ お母さんが ヤギ の おやつ を か 買いました。",
    reading: "ぼくのおかあさんがやぎのおやつをかいました",
    vietnamese: "Mẹ tôi đã mua đồ ăn vặt cho dê."
  },
  {
    text: "見てください。",
    furigana: "み 見てください。",
    reading: "みてください",
    vietnamese: "Mọi người nhìn này."
  },
  {
    text: "ここにヤギのおやつがあります。",
    furigana: "ここ に ヤギ の おやつ が あります。",
    reading: "ここにやぎのおやつがあります",
    vietnamese: "Ở đây có thức ăn cho các chú dê."
  },
  {
    text: "あっちの方にヤギがいるみたいです。",
    furigana: "あっち の ほう 方 に ヤギ が いるみたいです。",
    reading: "あっちのほうにやぎがいるみたいです",
    vietnamese: "Có vẻ đằng kia có mấy chú dê."
  },
  {
    text: "で、この餌を持って行って、ヤギにあげるみたいです。",
    furigana: "で、この えさ 餌 を も 持って い 行って、ヤギ に あげるみたいです。",
    reading: "でこのえさをもっていってやぎにあげるみたいです",
    vietnamese: "Và mình sẽ mang phần thức ăn này qua cho dê ăn."
  },
  {
    text: "アイスクリームを買いに来たんですけど、",
    furigana: "アイスクリーム を か 買い に き 来たんですけど、",
    reading: "あいすくりーむをかいにきたんですけど",
    vietnamese: "Đến để mua kem ăn cơ mà,"
  },
  {
    text: "アイスクリームがなくて、ヤギさんがいます。",
    furigana: "アイスクリーム が なくて、ヤギさん が います。",
    reading: "あいすくりーむがなくてやぎさんがいます",
    vietnamese: "Kem thì không có, mà lại có mấy chú dê."
  },
  {
    text: "ヤギ！ ヤギの餌を買ってきました！",
    furigana: "ヤギ！ ヤギ の えさ 餌 を か 買ってきました！",
    reading: "やぎやぎのえさをかってきました",
    vietnamese: "Dê ơi! Bọn mình mua đồ ăn tới rồi nè!"
  },
  {
    text: "今からみんなでヤギに餌をあげます。",
    furigana: "いま 今 から みんな で ヤギ に えさ 餌 を あげます。",
    reading: "いまからみんなでやぎにえさをあげます",
    vietnamese: "Bây giờ cả nhà sẽ cùng cho dê ăn nhé."
  },
  {
    text: "僕の家族、みんなあっちにいますね。",
    furigana: "ぼく 僕 の かぞく 家族、みんな あっち に いますね。",
    reading: "ぼくのかぞくみんなあっちにいますね",
    vietnamese: "Cả nhà tôi đang ở hết đằng kia rồi."
  },
  {
    text: "今からヤギに餌をあげます。",
    furigana: "いま 今 から ヤギ に えさ 餌 を あげます。",
    reading: "いまからやぎにえさをあげます",
    vietnamese: "Bắt đầu cho dê ăn thôi."
  },
  {
    text: "あらあら！ かわいいね！ （餌を）食べた！",
    furigana: "あらあら！ かわいいね！ （えさ 餌 を）た 食べた！",
    reading: "あらあらかわいいねたべた",
    vietnamese: "Ối chà! Dễ thương quá! Nó ăn rồi nè!"
  },
  {
    text: "ヤギさん、こんにちは！",
    furigana: "ヤギさん、こんにちは！",
    reading: "やぎさんこんにちは",
    vietnamese: "Chào bạn dê nhé!"
  },
  {
    text: "リンゴ好きなの？ 好きな食べ物は何ですか？",
    furigana: "リンゴ す 好きなの？ す 好きな た 食べもの 物 は なん 何ですか？",
    reading: "りんごすきなのすきなたべものはなんですか",
    vietnamese: "Thích táo hả? Món khoái khẩu của bạn là gì thế?"
  },
  {
    text: "リンゴ？ もうリンゴないよ！",
    furigana: "リンゴ？ もう リンゴ ないよ！",
    reading: "りんごもうりんごないよ",
    vietnamese: "Táo á? Hết táo rồi nha bạn ơi!"
  },
  {
    text: "小さいね！ 赤ちゃんですか？",
    furigana: "ちい 小さいね！ あか 赤ちゃん ですか？",
    reading: "ちいさいねあかちゃんですか",
    vietnamese: "Bé xíu xiu luôn! Là em bé dê hả?"
  },
  {
    text: "ヤギさん、こんにちは。",
    furigana: "ヤギさん、こんにちは。",
    reading: "やぎさんこんにちは",
    vietnamese: "Chào bạn dê nha."
  },
  {
    text: "こっちにもヤギさん来た！",
    furigana: "こっち にも ヤギさん き 来た！",
    reading: "こっちにもやぎさんきた",
    vietnamese: "Bên này cũng có bạn dê chạy tới kìa!"
  },
  {
    text: "こんにちは、こんにちは！",
    furigana: "こんにちは、こんにちは！",
    reading: "こんにちはこんにちは",
    vietnamese: "Xin chào, xin chào!"
  },
  {
    text: "ヤギさん、今日、日曜日ですよ！",
    furigana: "ヤギさん、きょう 今日、にちようび 日曜日 ですよ！",
    reading: "やぎさんきょうにちようびですよ",
    vietnamese: "Bạn dê ơi, hôm nay là Chủ Nhật đấy nhé!"
  },
  {
    text: "ちょっと待って！ カメラ、近い！！！",
    furigana: "ちょっと ま 待って！ カメラ、ちか 近い！！！",
    reading: "ちょっとまってかめらちかい",
    vietnamese: "Khoan đã! Bạn ghé sát ống kính quá rồi đấy!!!"
  },
  {
    text: "昨日来て、休み。",
    furigana: "きのう 昨日 き 来て、やす 休み。",
    reading: "きのうきてやすみ",
    vietnamese: "Hôm qua tới thì quán nghỉ."
  },
  {
    text: "今日は来たけど、お店はあいていたけど、アイスクリームが売り切れ。",
    furigana: "きょう 今日 は き 来たけど、おみせ お店 は あいていたけど、アイスクリーム が う 売りき 切れ。",
    reading: "きょうはきたけどおみせはあいていたけどあいすくりーむがうりきれ",
    vietnamese: "Hôm nay tới, quán mở cửa thật nhưng kem lại hết veo."
  },
  {
    text: "残念でした。",
    furigana: "ざんねん 残念でした。",
    reading: "ざんねんでした",
    vietnamese: "Tiếc thật sự luôn."
  },
  {
    text: "でも、貴重な体験ができました！",
    furigana: "でも、きちょう 貴重な たいけん 体験 が できました！",
    reading: "でもきちょうなたいけんができました",
    vietnamese: "Nhưng mà đã có được một trải nghiệm vô cùng quý giá!"
  },
  {
    text: "貴重な体験は珍しい体験、大事な体験、すごい いい体験、そういう意味です。",
    furigana: "きちょう 貴重な たいけん 体験 は めずら 珍しい たいけん 体験、だいじ 大事な たいけん 体験、すごい いい たいけん 体験、そういう いみ 意味 です。",
    reading: "きちょうなたいけんはめずらしいたいけんだいじなたいけんすごいいいたいけんそういういみです",
    vietnamese: "'Trải nghiệm quý giá' có nghĩa là trải nghiệm hiếm có, quan trọng, và cực kỳ tuyệt vời."
  },
  {
    text: "貴重な体験。",
    furigana: "きちょう 貴重な たいけん 体験。",
    reading: "きちょうなたいけん",
    vietnamese: "Trải nghiệm quý giá."
  },
  {
    text: "他の場所であんまりできない体験。",
    furigana: "ほか 他 の ばしょ 場所 で あんまり できない たいけん 体験。",
    reading: "ほかのばしょであんまりできないたいけん",
    vietnamese: "Một trải nghiệm khó mà có được ở những nơi khác."
  },
  {
    text: "楽しかったですね！ じゃあ、帰りますか。",
    furigana: "たの 楽しかったですね！ じゃあ、かえ 帰りますか。",
    reading: "たのしかったですねじゃあかえりますか",
    vietnamese: "Vui thật đấy nhỉ! Thôi, chúng ta về thôi nào."
  },
  {
    text: "アイスクリーム食べてないけど、帰りましょう。",
    furigana: "アイスクリーム た 食べでないけど、かえ 帰りましょう。",
    reading: "あいすくりーむたべてないけどかえりましょう",
    vietnamese: "Dù chưa được ăn kem nhưng thôi về nào."
  }
];

// 3. Ghép sanitized timecodes với details
const finalSentences = sanitized.map((s, idx) => {
  const detail = SENTENCE_DETAILS[idx] || {
    vietnamese: 'Đoạn hội thoại tiếng Nhật',
    furigana: s.text,
    reading: s.text,
  };

  const cleanChars = s.text.replace(/[\s。、・「」『』（）()[\]{}"'.,!?！？〜～…\u3000]/g, '');

  return {
    id: idx + 1,
    start: s.start,
    end: s.end,
    duration: s.duration,
    text: s.text,
    furigana: detail.furigana || s.text,
    reading: detail.reading || '',
    vietnamese: detail.vietnamese || '',
    charCount: cleanChars.length || s.text.length,
  };
});

const lessonData = {
  id: 'driving_vlog',
  title: 'Lái xe ngắm cảnh mùa hè & Đi ăn kem (ドライブ＆アイスクリーム)',
  videoId: 'lZifLIXWOPU',
  thumbnail: 'https://img.youtube.com/vi/lZifLIXWOPU/hqdefault.jpg',
  description: 'Toàn bộ 153 câu hội thoại thực tế bóc tách từ YouTube: Ken lái xe ngắm cảnh, tìm tiệm kem, học từ "日和" và "貴重な体験", cho dê ăn.',
  totalSentences: finalSentences.length,
  sentences: finalSentences,
};

const outputContent = `// src/data/kenVlogFullLesson.js
// Toàn bộ 153 câu được trích xuất và chuẩn hóa thời gian từ server/sample_raw_transcript.json

export const KEN_VLOG_FULL_LESSON = ${JSON.stringify(lessonData, null, 2)};
`;

fs.writeFileSync('src/data/kenVlogFullLesson.js', outputContent, 'utf-8');
fs.writeFileSync('server/cache/lZifLIXWOPU.json', JSON.stringify(lessonData, null, 2), 'utf-8');
console.log('Successfully synchronized natural timestamps into src/data/kenVlogFullLesson.js & server/cache/lZifLIXWOPU.json with', finalSentences.length, 'sentences!');
