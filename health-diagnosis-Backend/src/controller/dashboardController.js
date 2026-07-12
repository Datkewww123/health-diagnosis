class DashboardController {
  async getDailyData(req, res) {
    try {
      // 1. Danh sách lời khuyên sức khỏe phong phú
      const healthTips = [
        "Uống đủ từ 1.5 - 2 lít nước mỗi ngày giúp cơ thể thanh lọc độc tố và giảm thiểu triệu chứng đau đầu.",
        "Dành 15-30 phút vận động nhẹ nhàng mỗi ngày giúp tăng cường tuần hoàn máu và nâng cao hệ miễn dịch.",
        "Hạn chế sử dụng thiết bị điện tử ít nhất 30 phút trước khi đi ngủ để có giấc ngủ sâu và chất lượng hơn.",
        "Bổ sung nhiều rau xanh và trái cây tươi trong khẩu phần ăn hàng ngày giúp cung cấp vitamin và chất xơ cần thiết.",
        "Ăn uống đúng giờ, tránh bỏ bữa sáng để duy trì mức năng lượng ổn định cho cả ngày làm việc.",
        "Rửa tay thường xuyên bằng xà phòng trong ít nhất 20 giây để phòng ngừa các bệnh truyền nhiễm đường hô hấp.",
        "Kiểm tra sức khỏe định kỳ 6 tháng một lần giúp phát hiện sớm các nguy cơ bệnh lý tiềm ẩn.",
        "Hạn chế ăn quá nhiều muối và đường để bảo vệ hệ tim mạch và giảm nguy cơ đái tháo đường.",
        "Giữ tinh thần thoải mái, thực hành hít thở sâu khi căng thẳng để cân bằng huyết áp và nhịp tim.",
        "Không tự ý mua và sử dụng thuốc kháng sinh khi chưa có chỉ định của bác sĩ chuyên khoa.",
        "Bảo vệ làn da bằng cách bôi kem chống nắng và che chắn kỹ khi ra ngoài trời nắng nóng.",
        "Tập thói quen đi ngủ trước 23h và thức dậy sớm để đồng hồ sinh học cơ thể hoạt động tối ưu nhất."
      ];

      // 2. Danh sách bài viết y học chọn lọc
      const articles = [
        {
          title: "Cách phát hiện sớm các triệu chứng cúm A và phòng ngừa",
          desc: "Tìm hiểu các dấu hiệu phân biệt cúm A với cảm lạnh thông thường và các biện pháp chăm sóc y tế kịp thời tại nhà.",
          url: "https://exphar.com/en/flu-act-fast-from-first-symptoms/"
        },
        {
          title: "Sự khác biệt giữa đau nửa đầu (Migraine) và đau đầu do căng thẳng",
          desc: "Hiểu rõ căn nguyên y học của các cơn đau đầu để có phương hướng điều trị và dùng thuốc hiệu quả nhất.",
          url: "https://www.healthline.com/health/migraine/migraine-vs-headache"
        },
        {
          title: "Khi nào các triệu chứng sức khỏe cần bạn đi khám bác sĩ ngay?",
          desc: "Hướng dẫn nhận biết các dấu hiệu cảnh báo khẩn cấp cần sự can thiệp và chăm sóc chuyên khoa lập tức.",
          url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC7376822/"
        },
        {
          title: "Chế độ dinh dưỡng tối ưu cho người bệnh đái tháo đường",
          desc: "Làm thế nào để kiểm soát đường huyết hiệu quả thông qua thực đơn ăn uống khoa học hàng ngày.",
          url: "https://www.healthline.com/nutrition/diabetes-diet-menu"
        },
        {
          title: "Tác hại của việc lạm dụng kháng sinh và cảnh báo từ chuyên gia",
          desc: "Tình trạng kháng kháng sinh đang trở thành mối đe dọa toàn cầu. Tìm hiểu cách sử dụng thuốc an toàn.",
          url: "https://www.who.int/news-room/fact-sheets/detail/antimicrobial-resistance"
        },
        {
          title: "Cách phòng ngừa và kiểm soát bệnh tăng huyết áp tại nhà",
          desc: "Những thay đổi nhỏ trong lối sống như tập thể dục và giảm muối giúp duy trì huyết áp ổn định cực kỳ tốt.",
          url: "https://www.cdc.gov/bloodpressure/prevent.htm"
        },
        {
          title: "Viêm dạ dày cấp tính: Nguyên nhân, triệu chứng và chế độ ăn",
          desc: "Các món ăn nên tránh và cách làm dịu cơn đau dạ dày cấp nhanh chóng bằng các mẹo khoa học đơn giản.",
          url: "https://www.healthline.com/health/gastritis"
        },
        {
          title: "Hen suyễn ở trẻ em: Dấu hiệu nhận biết và cách xử trí",
          desc: "Hướng dẫn cha mẹ cách theo dõi cơn hen suyễn của trẻ và chuẩn bị phòng ngừa trong thời tiết giao mùa.",
          url: "https://www.nhlbi.nih.gov/health/asthma"
        }
      ];

      // 3. Sử dụng ngày hiện tại để xoay vòng dữ liệu mỗi ngày
      const today = new Date();
      const dayIndex = today.getDate(); // 1 - 31

      // Chọn 1 lời khuyên dựa trên ngày
      const tipIndex = dayIndex % healthTips.length;
      const selectedTip = healthTips[tipIndex];

      // Chọn 3 bài viết dựa trên ngày
      const selectedArticles = [];
      for (let i = 0; i < 3; i++) {
        const articleIndex = (dayIndex + i * 2) % articles.length;
        selectedArticles.push(articles[articleIndex]);
      }

      return res.status(200).json({
        ok: true,
        healthTip: selectedTip,
        articles: selectedArticles
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Lỗi máy chủ khi tải dữ liệu hàng ngày" });
    }
  }
}

module.exports = new DashboardController();
