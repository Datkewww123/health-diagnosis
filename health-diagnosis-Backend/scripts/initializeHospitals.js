const axios = require('axios');
const Hospital = require('../src/model/hospital');
const { sequelize } = require('../src/config/database');

// Bộ dữ liệu mock các bệnh viện lớn ở Việt Nam (phòng hờ khi Overpass API bị lỗi/chậm)
const MOCK_HOSPITALS = [
  {
    name: 'Bệnh viện Bạch Mai',
    address: '78 Giải Phóng, Phương Mai, Đống Đa, Hà Nội',
    latitude: 21.0014,
    longitude: 105.8431,
    phone: '024 3869 3731',
    description: 'Một trong những bệnh viện đa khoa lớn nhất Việt Nam.',
    image_url: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&q=80&w=800'
  },
  {
    name: 'Bệnh viện Chợ Rẫy',
    address: '201B Nguyễn Chí Thanh, Phường 12, Quận 5, TP. Hồ Chí Minh',
    latitude: 10.7578,
    longitude: 106.6603,
    phone: '028 3855 4137',
    description: 'Bệnh viện đa khoa trung ương cấp quốc gia lớn nhất khu vực phía Nam.',
    image_url: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=800'
  },
  {
    name: 'Bệnh viện Đa khoa Đà Nẵng',
    address: '124 Hải Phòng, Thạch Thang, Hải Châu, Đà Nẵng',
    latitude: 16.0722,
    longitude: 108.2173,
    phone: '0236 3821 118',
    description: 'Bệnh viện đa khoa hạng I trực thuộc Sở Y tế thành phố Đà Nẵng.',
    image_url: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&q=80&w=800'
  },
  {
    name: 'Bệnh viện Trung ương Huế',
    address: '16 Lê Lợi, Vĩnh Ninh, Thành phố Huế, Thừa Thiên Huế',
    latitude: 16.4632,
    longitude: 107.5847,
    phone: '0234 3822 325',
    description: 'Bệnh viện Tây y đầu tiên của Việt Nam, bệnh viện hạng đặc biệt.',
    image_url: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=800'
  }
];

async function initializeHospitals() {
  console.log('[Init Hospitals] Bắt đầu khởi tạo danh sách bệnh viện...');
  try {
    // 1. Thử lấy dữ liệu từ Overpass API
    const overpassUrl = 'https://overpass-api.de/api/interpreter';
    const overpassQuery = `
      [out:json][timeout:15];
      area["ISO3166-1"="VN"]->.searchArea;
      (
        node["amenity"="hospital"](area.searchArea);
        way["amenity"="hospital"](area.searchArea);
      );
      out center limit 50;
    `;

    console.log('[Init Hospitals] Đang kết nối tới Overpass API...');
    const response = await axios.post(overpassUrl, overpassQuery, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: 10000 // Giới hạn 10 giây tránh nghẽn
    });

    const elements = response.data?.elements || [];
    console.log(`[Init Hospitals] Overpass trả về ${elements.length} kết quả.`);

    if (elements.length === 0) {
      throw new Error('Overpass API trả về danh sách rỗng');
    }

    const hospitalsToSave = elements.map(el => {
      const tags = el.tags || {};
      const lat = el.lat || el.center?.lat;
      const lon = el.lon || el.center?.lon;
      
      const name = tags.name || tags['name:vi'] || tags['name:en'] || 'Bệnh viện không rõ tên';
      const street = tags['addr:street'] || '';
      const city = tags['addr:city'] || '';
      const address = tags['addr:full'] || (street || city ? `${street} ${city}`.trim() : 'Địa chỉ đang cập nhật');

      return {
        name,
        address,
        latitude: parseFloat(lat),
        longitude: parseFloat(lon),
        phone: tags.phone || tags['contact:phone'] || '1900 xxxx',
        description: tags.description || 'Bệnh viện đa khoa chăm sóc sức khỏe cộng đồng.',
        image_url: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&q=80&w=800'
      };
    }).filter(h => !isNaN(h.latitude) && !isNaN(h.longitude));

    await saveHospitals(hospitalsToSave);

  } catch (error) {
    console.warn('[Init Hospitals] Không thể lấy dữ liệu từ Overpass API (Lỗi hoặc Timeout). Chuyển sang dùng dữ liệu Mock thiết yếu...');
    await saveHospitals(MOCK_HOSPITALS);
  }
}

async function saveHospitals(hospitalList) {
  // Lưu vào Database
  for (const h of hospitalList) {
    try {
      const [hospital, created] = await Hospital.findOrCreate({
        where: { name: h.name },
        defaults: {
          address: h.address,
          latitude: h.latitude,
          longitude: h.longitude,
          phone: h.phone,
          description: h.description,
          image_url: h.image_url,
          location: sequelize.literal(`ST_GeomFromText('POINT(${h.longitude} ${h.latitude})')`)
        }
      });
      if (created) {
        console.log(`[Init Hospitals] Đã thêm bệnh viện mới: ${h.name}`);
      }
    } catch (err) {
      console.error(`[Init Hospitals] Lỗi khi lưu bệnh viện ${h.name}:`, err.message);
    }
  }
  console.log('[Init Hospitals] Hoàn tất lưu danh sách bệnh viện.');
}

module.exports = initializeHospitals;
