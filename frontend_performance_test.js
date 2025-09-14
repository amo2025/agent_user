// 前端性能测试脚本
// 用于自动化性能测试和数据收集

class FrontendPerformanceTester {
  constructor() {
    this.results = {
      pageLoad: {},
      componentRender: {},
      memoryUsage: {},
      apiPerformance: {}
    };
  }

  // 页面加载性能测试
  async testPageLoadPerformance() {
    console.log('🚀 开始页面加载性能测试...');

    const testUrls = [
      '/login',
      '/register',
      '/dashboard',
      '/create-agent',
      '/execute-agent'
    ];

    for (const url of testUrls) {
      const startTime = performance.now();

      // 模拟页面加载
      await this.navigateToPage(url);

      const loadTime = performance.now() - startTime;

      // 收集Web Vitals指标
      const vitals = await this.collectWebVitals();

      this.results.pageLoad[url] = {
        loadTime,
        vitals,
        timestamp: new Date().toISOString()
      };

      console.log(`✅ ${url} 加载时间: ${loadTime.toFixed(2)}ms`);
    }
  }

  // React组件渲染性能测试
  async testComponentRenderPerformance() {
    console.log('⚛️ 开始React组件渲染性能测试...');

    // 测试关键组件的渲染性能
    const components = [
      'LoginForm',
      'AgentList',
      'WorkflowEditor',
      'ExecutionConsole'
    ];

    for (const componentName of components) {
      const renderTimes = [];

      // 多次渲染测试
      for (let i = 0; i < 10; i++) {
        const startTime = performance.now();

        // 模拟组件渲染
        await this.renderComponent(componentName);

        const renderTime = performance.now() - startTime;
        renderTimes.push(renderTime);
      }

      const avgRenderTime = renderTimes.reduce((a, b) => a + b, 0) / renderTimes.length;

      this.results.componentRender[componentName] = {
        avgRenderTime,
        minRenderTime: Math.min(...renderTimes),
        maxRenderTime: Math.max(...renderTimes),
        renderTimes
      };

      console.log(`✅ ${componentName} 平均渲染时间: ${avgRenderTime.toFixed(2)}ms`);
    }
  }

  // 内存使用测试
  async testMemoryUsage() {
    console.log('💾 开始内存使用测试...');

    const initialMemory = performance.memory;

    // 模拟用户操作序列
    const operations = [
      'login',
      'createAgent',
      'executeAgent',
      'viewLogs',
      'createWorkflow',
      'executeWorkflow'
    ];

    const memorySnapshots = [];

    for (const operation of operations) {
      await this.simulateOperation(operation);

      const memoryInfo = performance.memory;
      memorySnapshots.push({
        operation,
        usedJSHeapSize: memoryInfo.usedJSHeapSize,
        totalJSHeapSize: memoryInfo.totalJSHeapSize,
        jsHeapSizeLimit: memoryInfo.jsHeapSizeLimit,
        timestamp: new Date().toISOString()
      });

      // 强制垃圾回收（如果可用）
      if (window.gc) {
        window.gc();
      }
    }

    this.results.memoryUsage = {
      initialMemory,
      memorySnapshots,
      memoryGrowth: memorySnapshots[memorySnapshots.length - 1].usedJSHeapSize - initialMemory.usedJSHeapSize
    };

    console.log(`✅ 内存使用增长: ${(this.results.memoryUsage.memoryGrowth / 1024 / 1024).toFixed(2)}MB`);
  }

  // API性能测试
  async testAPIPerformance() {
    console.log('🌐 开始API性能测试...');

    const endpoints = [
      { method: 'POST', url: '/api/auth/login', data: { email: 'test@example.com', password: 'test123' } },
      { method: 'POST', url: '/api/agents', data: { description: '测试Agent' } },
      { method: 'GET', url: '/api/agents' },
      { method: 'POST', url: '/api/workflows', data: { name: '测试工作流', nodes: [] } },
      { method: 'GET', url: '/api/workflows' }
    ];

    for (const endpoint of endpoints) {
      const responseTimes = [];

      // 多次请求测试
      for (let i = 0; i < 10; i++) {
        const startTime = performance.now();

        try {
          const response = await this.makeAPIRequest(endpoint);
          const responseTime = performance.now() - startTime;
          responseTimes.push(responseTime);

          if (!response.ok) {
            console.warn(`⚠️ ${endpoint.url} 请求失败: ${response.status}`);
          }
        } catch (error) {
          console.error(`❌ ${endpoint.url} 请求错误:`, error);
        }
      }

      const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;

      this.results.apiPerformance[endpoint.url] = {
        avgResponseTime,
        minResponseTime: Math.min(...responseTimes),
        maxResponseTime: Math.max(...responseTimes),
        responseTimes
      };

      console.log(`✅ ${endpoint.url} 平均响应时间: ${avgResponseTime.toFixed(2)}ms`);
    }
  }

  // 收集Web Vitals指标
  async collectWebVitals() {
    return new Promise((resolve) => {
      const vitals = {};

      // FCP (First Contentful Paint)
      new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          vitals.fcp = entry.startTime;
        }
      }).observe({ entryTypes: ['paint'] });

      // LCP (Largest Contentful Paint)
      new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          vitals.lcp = entry.startTime;
        }
      }).observe({ entryTypes: ['largest-contentful-paint'] });

      // FID (First Input Delay)
      new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          vitals.fid = entry.processingStart - entry.startTime;
        }
      }).observe({ entryTypes: ['first-input'] });

      // CLS (Cumulative Layout Shift)
      let clsValue = 0;
      new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        }
        vitals.cls = clsValue;
      }).observe({ entryTypes: ['layout-shift'] });

      // 等待一段时间收集数据
      setTimeout(() => resolve(vitals), 5000);
    });
  }

  // 模拟页面导航
  async navigateToPage(url) {
    // 在实际环境中，这里应该是真实的页面导航
    return new Promise(resolve => {
      setTimeout(resolve, Math.random() * 1000 + 500); // 模拟网络延迟
    });
  }

  // 模拟组件渲染
  async renderComponent(componentName) {
    // 在实际环境中，这里应该是真实的组件渲染
    return new Promise(resolve => {
      setTimeout(resolve, Math.random() * 50 + 10); // 模拟渲染时间
    });
  }

  // 模拟用户操作
  async simulateOperation(operation) {
    // 在实际环境中，这里应该是真实的用户操作
    return new Promise(resolve => {
      setTimeout(resolve, Math.random() * 2000 + 500); // 模拟操作时间
    });
  }

  // 模拟API请求
  async makeAPIRequest(endpoint) {
    // 在实际环境中，这里应该是真实的API请求
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({ ok: true, status: 200 });
      }, Math.random() * 300 + 50); // 模拟API延迟
    });
  }

  // 运行所有测试
  async runAllTests() {
    console.log('🎯 开始前端性能测试套件...');
    console.log('=' * 50);

    const startTime = Date.now();

    try {
      await this.testPageLoadPerformance();
      await this.testComponentRenderPerformance();
      await this.testMemoryUsage();
      await this.testAPIPerformance();

      const totalTime = Date.now() - startTime;

      console.log('=' * 50);
      console.log(`✅ 所有测试完成！总耗时: ${totalTime}ms`);

      return this.results;
    } catch (error) {
      console.error('❌ 测试执行失败:', error);
      throw error;
    }
  }

  // 生成测试报告
  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalTests: Object.keys(this.results).length,
        avgPageLoadTime: this.calculateAveragePageLoadTime(),
        avgRenderTime: this.calculateAverageRenderTime(),
        memoryGrowth: this.results.memoryUsage.memoryGrowth
      },
      details: this.results
    };

    return report;
  }

  calculateAveragePageLoadTime() {
    const loadTimes = Object.values(this.results.pageLoad).map(p => p.loadTime);
    return loadTimes.reduce((a, b) => a + b, 0) / loadTimes.length;
  }

  calculateAverageRenderTime() {
    const renderTimes = Object.values(this.results.componentRender).map(c => c.avgRenderTime);
    return renderTimes.reduce((a, b) => a + b, 0) / renderTimes.length;
  }
}

// 性能测试运行器
async function runFrontendPerformanceTest() {
  const tester = new FrontendPerformanceTester();

  try {
    await tester.runAllTests();
    const report = tester.generateReport();

    console.log('📊 测试报告:');
    console.log(JSON.stringify(report, null, 2));

    return report;
  } catch (error) {
    console.error('测试失败:', error);
    throw error;
  }
}

// 导出测试工具
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { FrontendPerformanceTester, runFrontendPerformanceTest };
}

// 如果直接运行
if (typeof window !== 'undefined') {
  window.FrontendPerformanceTester = FrontendPerformanceTester;
  window.runFrontendPerformanceTest = runFrontendPerformanceTest;
}