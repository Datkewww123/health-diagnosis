/*
 * cron.js — Lập lịch tự động cho các tác vụ nền
 *
 * Hospitals: refresh từ Overpass, Chủ Nhật hàng tuần lúc 0:00
 * News: fetch từ NewsData.io, mỗi 6 giờ
 */

const cron = require('node-cron');
const initializeHospitals = require('../../scripts/initializeHospitals');
const { fetchAndSaveNews } = require('./newsService');

function startCronJobs() {
  console.log('[Cron] Khởi động cron jobs...');

  // Hospitals — mỗi Chủ Nhật 0:00
  cron.schedule('0 0 * * 0', async () => {
    console.log('[Cron] Bắt đầu refresh hospitals từ Overpass...');
    try { await initializeHospitals(); }
    catch (err) { console.error('[Cron] Hospitals error:', err.message); }
  });

  // News — mỗi 2 giờ
  cron.schedule('0 */2 * * *', async () => {
    console.log('[Cron] Bắt đầu fetch news...');
    try {
      const count = await fetchAndSaveNews();
      console.log(`[Cron] News: ${count} bài mới`);
    } catch (err) {
      console.error('[Cron] News error:', err.message);
    }
  });

  console.log('[Cron] Cron jobs đã sẵn sàng');
}

module.exports = { startCronJobs };
