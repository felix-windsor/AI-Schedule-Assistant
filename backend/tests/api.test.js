/**
 * API 集成测试
 * 需要先启动服务器: node src/app.js
 */

const axios = require('axios');

const API_BASE = 'http://localhost:5000';
const API_ENDPOINT = `${API_BASE}/api/v1/events/parse`;

// 测试用例
const testCases = [
  {
    name: '健康检查',
    method: 'GET',
    url: `${API_BASE}/health`,
    expectedStatus: 200,
  },
  {
    name: '简单事件解析',
    method: 'POST',
    url: API_ENDPOINT,
    data: {
      text: '明天下午3点和老板开会',
      context: {
        current_time: '2025-01-01T20:00:00+08:00',
        timezone: 'Asia/Shanghai',
        locale: 'zh-CN',
      },
    },
    expectedStatus: 200,
    validate: (data) => {
      return data.success && data.events && data.events.length > 0;
    },
  },
  {
    name: '多个事件解析',
    method: 'POST',
    url: API_ENDPOINT,
    data: {
      text: '明天下午3点开会，5点健身，晚上8点吃饭',
      context: {
        current_time: '2025-01-01T20:00:00+08:00',
        timezone: 'Asia/Shanghai',
        locale: 'zh-CN',
      },
    },
    expectedStatus: 200,
    validate: (data) => {
      return data.success && data.events && data.events.length >= 3;
    },
  },
  {
    name: '空输入错误',
    method: 'POST',
    url: API_ENDPOINT,
    data: {
      text: '',
      context: {
        current_time: '2025-01-01T20:00:00+08:00',
        timezone: 'Asia/Shanghai',
      },
    },
    expectedStatus: 400,
    validate: (data) => {
      return !data.success && data.error && data.error.code === 'E1001';
    },
  },
  {
    name: '缺少 context 错误',
    method: 'POST',
    url: API_ENDPOINT,
    data: {
      text: '明天开会',
    },
    expectedStatus: 400,
    validate: (data) => {
      return !data.success && data.error && data.error.code === 'E1002';
    },
  },
  {
    name: '无效时区错误',
    method: 'POST',
    url: API_ENDPOINT,
    data: {
      text: '明天开会',
      context: {
        current_time: '2025-01-01T20:00:00+08:00',
        timezone: 'Invalid/Timezone',
      },
    },
    expectedStatus: 400,
    validate: (data) => {
      return !data.success && data.error && data.error.code === 'E1003';
    },
  },
];

// 运行测试
async function runTests() {
  console.log('========================================');
  console.log('API 集成测试');
  console.log('========================================\n');

  let passed = 0;
  let failed = 0;

  for (const testCase of testCases) {
    try {
      console.log(`测试: ${testCase.name}`);

      let response;
      if (testCase.method === 'GET') {
        response = await axios.get(testCase.url);
      } else {
        response = await axios.post(testCase.url, testCase.data, {
          validateStatus: () => true, // 不抛出错误，让我们自己处理
        });
      }

      // 检查状态码
      if (response.status !== testCase.expectedStatus) {
        console.log(`❌ 失败: 状态码不匹配 (预期: ${testCase.expectedStatus}, 实际: ${response.status})`);
        failed++;
        continue;
      }

      // 如果有验证函数，执行验证
      if (testCase.validate) {
        const isValid = testCase.validate(response.data);
        if (!isValid) {
          console.log(`❌ 失败: 数据验证失败`);
          console.log(`响应数据:`, JSON.stringify(response.data, null, 2));
          failed++;
          continue;
        }
      }

      console.log(`✅ 通过`);
      if (testCase.method === 'POST' && response.data.success) {
        console.log(`   解析出 ${response.data.events?.length || 0} 个事件`);
      }
      passed++;

    } catch (error) {
      console.log(`❌ 失败: ${error.message}`);
      if (error.response) {
        console.log(`   状态码: ${error.response.status}`);
        console.log(`   响应:`, JSON.stringify(error.response.data, null, 2));
      }
      failed++;
    }

    console.log('');
  }

  console.log('========================================');
  console.log(`结果: ${passed}/${testCases.length} 通过`);
  console.log(`通过率: ${((passed / testCases.length) * 100).toFixed(1)}%`);
  console.log('========================================');

  if (failed === 0) {
    console.log('\n✅ 所有测试通过！');
    process.exit(0);
  } else {
    console.log(`\n❌ ${failed} 个测试失败`);
    process.exit(1);
  }
}

// 检查服务器是否运行
async function checkServer() {
  try {
    await axios.get(`${API_BASE}/health`, { timeout: 2000 });
    return true;
  } catch (error) {
    console.error('❌ 无法连接到服务器');
    console.error('请先启动服务器: node backend/src/app.js');
    process.exit(1);
  }
}

// 主函数
async function main() {
  await checkServer();
  await runTests();
}

main();

