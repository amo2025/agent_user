#!/usr/bin/env python3
"""
Agent User Platform 后端性能测试脚本 - 简化版本
使用模拟数据进行性能测试
"""

import asyncio
import time
import json
import statistics
from typing import Dict, List, Any
from dataclasses import dataclass
from datetime import datetime
import random
import psutil
import matplotlib.pyplot as plt
import numpy as np

@dataclass
class TestResult:
    """测试结果数据类"""
    name: str
    avg_response_time: float
    min_response_time: float
    max_response_time: float
    success_rate: float
    requests_per_second: float
    error_count: int
    total_requests: int
    response_times: List[float]
    timestamp: str

class BackendPerformanceTester:
    """后端性能测试器 - 简化版本"""

    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url.rstrip('/')
        self.results: Dict[str, TestResult] = {}
        self.system_metrics: List[Dict[str, Any]] = []
        self.monitoring = False
        self.monitoring_thread = None

    # 模拟后端响应
    async def simulate_api_response(self, endpoint: str, method: str, data: Dict = None) -> Dict:
        """模拟API响应"""
        # 模拟不同端点的响应时间
        base_delay = {
            "register": 200,
            "login": 150,
            "get_agents": 100,
            "create_agent": 300,
            "execute_agent": 2000,  # Agent执行较慢
            "get_workflows": 120,
            "create_workflow": 250,
            "execute_workflow": 1500,  # 工作流执行较慢
            "health": 50
        }

        # 添加随机延迟变化
        endpoint_key = endpoint.split('/')[-1]
        base_time = base_delay.get(endpoint_key, 100)
        random_delay = random.uniform(-0.3, 0.3)  # ±30%变化
        response_time = base_time * (1 + random_delay)

        # 模拟随机错误（2%错误率）
        if random.random() < 0.02:
            await asyncio.sleep(response_time / 1000)
            return {"success": False, "error": "模拟错误", "status_code": 500}

        # 模拟正常响应
        await asyncio.sleep(response_time / 1000)

        if endpoint_key == "health":
            return {"success": True, "status_code": 200, "data": {"status": "healthy"}}
        elif endpoint_key == "register":
            return {"success": True, "status_code": 201, "data": {"id": "user_123", "email": data.get("email")}}
        elif endpoint_key == "login":
            return {"success": True, "status_code": 200, "data": {"access_token": "mock_token_123", "token_type": "bearer"}}
        elif endpoint_key == "get_agents":
            return {"success": True, "status_code": 200, "data": [
                {"id": "agent_1", "name": "测试Agent 1", "description": "这是一个测试Agent"},
                {"id": "agent_2", "name": "测试Agent 2", "description": "这是另一个测试Agent"}
            ]}
        elif endpoint_key == "create_agent":
            return {"success": True, "status_code": 201, "data": {"id": "agent_new", "name": data.get("name", "新Agent"), "description": data.get("description")}}
        elif endpoint_key == "execute_agent":
            return {"success": True, "status_code": 200, "data": {"id": "exec_123", "status": "completed", "output": "Agent执行完成，输出结果..."}}
        elif endpoint_key == "get_workflows":
            return {"success": True, "status_code": 200, "data": [
                {"id": "workflow_1", "name": "测试工作流 1", "description": "这是一个测试工作流"},
                {"id": "workflow_2", "name": "测试工作流 2", "description": "这是另一个测试工作流"}
            ]}
        elif endpoint_key == "create_workflow":
            return {"success": True, "status_code": 201, "data": {"id": "workflow_new", "name": data.get("name"), "description": data.get("description")}}
        elif endpoint_key == "execute_workflow":
            return {"success": True, "status_code": 200, "data": {"id": "exec_456", "status": "completed", "output": "工作流执行完成，输出结果..."}}
        else:
            return {"success": True, "status_code": 200, "data": {}}

    async def test_api_endpoints(self) -> Dict[str, TestResult]:
        """测试API端点性能"""
        print("🚀 开始API端点性能测试...")

        # 测试用例定义
        test_cases = [
            {
                "name": "用户注册",
                "method": "POST",
                "endpoint": "register",
                "url": f"{self.base_url}/api/auth/register",
                "data": {
                    "email": f"test_{int(time.time())}@example.com",
                    "password": "test123456",
                    "username": f"testuser_{int(time.time())}"
                }
            },
            {
                "name": "用户登录",
                "method": "POST",
                "endpoint": "login",
                "url": f"{self.base_url}/api/auth/login",
                "data": {
                    "email": "test@example.com",
                    "password": "test123456"
                }
            },
            {
                "name": "获取Agent列表",
                "method": "GET",
                "endpoint": "get_agents",
                "url": f"{self.base_url}/api/agents"
            },
            {
                "name": "创建Agent",
                "method": "POST",
                "endpoint": "create_agent",
                "url": f"{self.base_url}/api/agents",
                "data": {
                    "description": "测试Agent - 用于性能测试",
                    "name": f"test_agent_{int(time.time())}"
                }
            },
            {
                "name": "执行Agent",
                "method": "POST",
                "endpoint": "execute_agent",
                "url": f"{self.base_url}/api/agents/123/execute",
                "data": {
                    "agent_id": "123",
                    "input": "测试输入数据"
                }
            },
            {
                "name": "获取工作流列表",
                "method": "GET",
                "endpoint": "get_workflows",
                "url": f"{self.base_url}/api/workflows"
            },
            {
                "name": "创建工作流",
                "method": "POST",
                "endpoint": "create_workflow",
                "url": f"{self.base_url}/api/workflows",
                "data": {
                    "name": f"test_workflow_{int(time.time())}",
                    "description": "测试工作流",
                    "nodes": [],
                    "edges": []
                }
            },
            {
                "name": "执行工作流",
                "method": "POST",
                "endpoint": "execute_workflow",
                "url": f"{self.base_url}/api/workflows/456/execute",
                "data": {
                    "workflow_id": "456",
                    "input": "测试工作流输入"
                }
            },
            {
                "name": "健康检查",
                "method": "GET",
                "endpoint": "health",
                "url": f"{self.base_url}/api/health"
            }
        ]

        # 测试每个端点
        for test_case in test_cases:
            result = await self._test_single_endpoint(test_case)
            self.results[test_case["name"]] = result

        return self.results

    async def _test_single_endpoint(self, test_case: Dict, num_requests: int = 30) -> TestResult:
        """测试单个API端点"""
        print(f"  测试 {test_case['name']}...")

        response_times = []
        error_count = 0
        success_count = 0

        start_time = time.time()

        # 并发执行所有请求
        tasks = []
        for i in range(num_requests):
            task = self._make_single_request(test_case, i)
            tasks.append(task)

        results = await asyncio.gather(*tasks, return_exceptions=True)

        for result in results:
            if isinstance(result, Exception):
                error_count += 1
            else:
                if result["success"]:
                    response_times.append(result["response_time"])
                    success_count += 1
                else:
                    error_count += 1

        end_time = time.time()
        total_time = end_time - start_time

        # 计算统计数据
        if response_times:
            avg_response_time = statistics.mean(response_times)
            min_response_time = min(response_times)
            max_response_time = max(response_times)
        else:
            avg_response_time = min_response_time = max_response_time = 0

        success_rate = success_count / num_requests if num_requests > 0 else 0
        requests_per_second = num_requests / total_time if total_time > 0 else 0

        result = TestResult(
            name=test_case["name"],
            avg_response_time=avg_response_time,
            min_response_time=min_response_time,
            max_response_time=max_response_time,
            success_rate=success_rate,
            requests_per_second=requests_per_second,
            error_count=error_count,
            total_requests=num_requests,
            response_times=response_times,
            timestamp=datetime.now().isoformat()
        )

        print(f"    ✅ 平均响应时间: {avg_response_time:.2f}ms")
        print(f"    ✅ 成功率: {success_rate:.2%}")
        print(f"    ✅ 请求速度: {requests_per_second:.2f} req/s")

        return result

    async def _make_single_request(self, test_case: Dict, request_id: int) -> Dict:
        """执行单个请求"""
        start_time = time.time()

        try:
            # 使用模拟响应
            result = await self.simulate_api_response(
                test_case["endpoint"],
                test_case["method"],
                test_case.get("data")
            )

            response_time = (time.time() - start_time) * 1000  # 转换为毫秒

            return {
                "success": result["success"],
                "response_time": response_time,
                "status_code": result.get("status_code", 200),
                "request_id": request_id
            }

        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            print(f"    ⚠️ 请求失败: {e}")
            return {
                "success": False,
                "response_time": response_time,
                "error": str(e),
                "request_id": request_id
            }

    async def test_concurrent_load(self, concurrent_users: int = 50, test_duration: int = 30) -> Dict[str, Any]:
        """测试并发负载能力"""
        print(f"🔥 开始并发负载测试 - {concurrent_users} 并发用户, {test_duration}秒...")

        results = {
            "concurrent_users": concurrent_users,
            "test_duration": test_duration,
            "total_requests": 0,
            "successful_requests": 0,
            "failed_requests": 0,
            "avg_response_time": 0,
            "min_response_time": float('inf'),
            "max_response_time": 0,
            "requests_per_second": 0,
            "error_rate": 0,
            "response_time_percentiles": {},
            "timestamp": datetime.now().isoformat()
        }

        all_response_times = []

        async def user_simulation(user_id: int):
            """模拟单个用户行为"""
            user_results = {
                "requests": 0,
                "successful_requests": 0,
                "response_times": []
            }

            end_time = time.time() + test_duration

            while time.time() < end_time:
                try:
                    # 模拟用户行为序列
                    actions = [
                        ("GET", "get_agents"),
                        ("POST", "create_agent", {"description": f"测试Agent {user_id}"}),
                        ("GET", "get_workflows"),
                        ("GET", "health")
                    ]

                    for method, endpoint, *data in actions:
                        start_time = time.time()

                        try:
                            result = await self.simulate_api_response(
                                endpoint,
                                method,
                                data[0] if data else None
                            )

                            response_time = (time.time() - start_time) * 1000

                            user_results["requests"] += 1
                            user_results["response_times"].append(response_time)

                            if result["success"]:
                                user_results["successful_requests"] += 1

                            # 随机等待，模拟真实用户行为
                            await asyncio.sleep(random.uniform(0.5, 2.0))

                        except Exception as e:
                            print(f"用户 {user_id} 请求失败: {e}")
                            continue

                except Exception as e:
                    print(f"用户 {user_id} 模拟失败: {e}")
                    continue

            return user_results

        # 启动所有用户模拟
        start_time = time.time()
        tasks = [user_simulation(i) for i in range(concurrent_users)]
        user_results = await asyncio.gather(*tasks)
        end_time = time.time()

        # 汇总结果
        total_requests = 0
        successful_requests = 0
        all_response_times = []

        for user_result in user_results:
            total_requests += user_result["requests"]
            successful_requests += user_result["successful_requests"]
            all_response_times.extend(user_result["response_times"])

        # 计算统计数据
        if all_response_times:
            results["total_requests"] = total_requests
            results["successful_requests"] = successful_requests
            results["failed_requests"] = total_requests - successful_requests
            results["avg_response_time"] = statistics.mean(all_response_times)
            results["min_response_time"] = min(all_response_times)
            results["max_response_time"] = max(all_response_times)
            results["requests_per_second"] = total_requests / (end_time - start_time)
            results["error_rate"] = (total_requests - successful_requests) / total_requests if total_requests > 0 else 0

            # 计算百分位数
            all_response_times.sort()
            results["response_time_percentiles"] = {
                "p50": np.percentile(all_response_times, 50),
                "p75": np.percentile(all_response_times, 75),
                "p90": np.percentile(all_response_times, 90),
                "p95": np.percentile(all_response_times, 95),
                "p99": np.percentile(all_response_times, 99)
            }

        print(f"    ✅ 总请求数: {total_requests}")
        print(f"    ✅ 成功请求: {successful_requests}")
        print(f"    ✅ 平均响应时间: {results['avg_response_time']:.2f}ms")
        print(f"    ✅ 请求速度: {results['requests_per_second']:.2f} req/s")
        print(f"    ✅ 错误率: {results['error_rate']:.2%}")

        return results

    def generate_performance_report(self) -> Dict[str, Any]:
        """生成性能测试报告"""
        report = {
            "timestamp": datetime.now().isoformat(),
            "base_url": self.base_url,
            "summary": {
                "total_endpoints_tested": len(self.results),
                "avg_response_time": self._calculate_overall_avg_response_time(),
                "min_response_time": self._calculate_overall_min_response_time(),
                "max_response_time": self._calculate_overall_max_response_time(),
                "overall_success_rate": self._calculate_overall_success_rate()
            },
            "api_performance": {
                endpoint: {
                    "avg_response_time": result.avg_response_time,
                    "min_response_time": result.min_response_time,
                    "max_response_time": result.max_response_time,
                    "success_rate": result.success_rate,
                    "requests_per_second": result.requests_per_second,
                    "error_count": result.error_count,
                    "total_requests": result.total_requests
                }
                for endpoint, result in self.results.items()
            },
            "recommendations": self._generate_recommendations()
        }

        return report

    def _calculate_overall_avg_response_time(self) -> float:
        """计算整体平均响应时间"""
        if not self.results:
            return 0

        response_times = [result.avg_response_time for result in self.results.values()]
        return statistics.mean(response_times)

    def _calculate_overall_min_response_time(self) -> float:
        """计算整体最小响应时间"""
        if not self.results:
            return 0

        min_times = [result.min_response_time for result in self.results.values()]
        return min(min_times)

    def _calculate_overall_max_response_time(self) -> float:
        """计算整体最大响应时间"""
        if not self.results:
            return 0

        max_times = [result.max_response_time for result in self.results.values()]
        return max(max_times)

    def _calculate_overall_success_rate(self) -> float:
        """计算整体成功率"""
        if not self.results:
            return 0

        success_rates = [result.success_rate for result in self.results.values()]
        return statistics.mean(success_rates)

    def _generate_recommendations(self) -> List[str]:
        """生成优化建议"""
        recommendations = []

        # 基于测试结果生成建议
        if self.results:
            # 检查响应时间
            slow_endpoints = [
                name for name, result in self.results.items()
                if result.avg_response_time > 1000  # 大于1秒
            ]

            if slow_endpoints:
                recommendations.append(
                    f"⚠️  发现慢响应端点: {', '.join(slow_endpoints)}。"
                    f"建议优化这些端点的性能，目标响应时间应小于500ms。"
                )

            # 检查成功率
            low_success_rate_endpoints = [
                name for name, result in self.results.items()
                if result.success_rate < 0.95  # 成功率低于95%
            ]

            if low_success_rate_endpoints:
                recommendations.append(
                    f"⚠️  发现成功率较低的端点: {', '.join(low_success_rate_endpoints)}。"
                    f"建议检查错误日志并修复相关问题。"
                )

            # 检查错误数量
            high_error_endpoints = [
                name for name, result in self.results.items()
                if result.error_count > result.total_requests * 0.1  # 错误率超过10%
            ]

            if high_error_endpoints:
                recommendations.append(
                    f"⚠️  发现错误率较高的端点: {', '.join(high_error_endpoints)}。"
                    f"建议增加错误处理和重试机制。"
                )

        if not recommendations:
            recommendations.append("✅ 系统性能表现良好，暂无优化建议。")

        return recommendations

    def save_report(self, filename: str = None):
        """保存测试报告到文件"""
        if filename is None:
            filename = f"backend_performance_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"

        report = self.generate_performance_report()

        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(report, f, ensure_ascii=False, indent=2)

        print(f"📊 性能测试报告已保存到: {filename}")
        return filename

    def plot_performance_charts(self):
        """生成性能图表"""
        if not self.results:
            print("没有测试结果可用于生成图表")
            return

        # API响应时间对比图
        plt.figure(figsize=(12, 8))

        endpoints = list(self.results.keys())
        avg_times = [self.results[ep].avg_response_time for ep in endpoints]
        min_times = [self.results[ep].min_response_time for ep in endpoints]
        max_times = [self.results[ep].max_response_time for ep in endpoints]

        x = np.arange(len(endpoints))
        width = 0.25

        plt.bar(x - width, min_times, width, label='最小响应时间', alpha=0.8)
        plt.bar(x, avg_times, width, label='平均响应时间', alpha=0.8)
        plt.bar(x + width, max_times, width, label='最大响应时间', alpha=0.8)

        plt.xlabel('API端点')
        plt.ylabel('响应时间 (ms)')
        plt.title('API端点响应时间对比')
        plt.xticks(x, endpoints, rotation=45, ha='right')
        plt.legend()
        plt.tight_layout()

        chart_filename = f"api_response_times_{datetime.now().strftime('%Y%m%d_%H%M%S')}.png"
        plt.savefig(chart_filename, dpi=300, bbox_inches='tight')
        plt.close()

        print(f"📈 API响应时间图表已保存到: {chart_filename}")

async def run_backend_performance_test_simple():
    """运行完整的后端性能测试（简化版本）"""
    print("🎯 开始Agent User Platform后端性能测试（简化版）")
    print("=" * 60)

    tester = BackendPerformanceTester()

    try:
        # 1. API端点性能测试
        print("\n📋 第一阶段: API端点性能测试")
        api_results = await tester.test_api_endpoints()

        # 2. 并发负载测试
        print("\n📋 第二阶段: 并发负载测试")
        load_test_results = await tester.test_concurrent_load(concurrent_users=30, test_duration=20)

        # 生成报告
        print("\n📋 生成测试报告...")
        report_filename = tester.save_report()

        # 生成图表
        print("\n📋 生成性能图表...")
        tester.plot_performance_charts()

        # 打印总结
        print("\n" + "=" * 60)
        print("🎯 后端性能测试完成!")
        print(f"📊 详细报告已保存到: {report_filename}")

        # 打印关键指标
        report = tester.generate_performance_report()
        print(f"\n📈 关键性能指标:")
        print(f"   平均API响应时间: {report['summary']['avg_response_time']:.2f}ms")
        print(f"   整体成功率: {report['summary']['overall_success_rate']:.2%}")
        print(f"   最小响应时间: {report['summary']['min_response_time']:.2f}ms")
        print(f"   最大响应时间: {report['summary']['max_response_time']:.2f}ms")
        print(f"   并发处理能力: {load_test_results['requests_per_second']:.2f} req/s")

        print(f"\n💡 优化建议:")
        for recommendation in report['recommendations']:
            print(f"   {recommendation}")

        return {
            "api_performance": api_results,
            "load_test": load_test_results,
            "report": report
        }

    except Exception as e:
        print(f"❌ 测试执行失败: {e}")
        raise e

if __name__ == "__main__":
    # 运行性能测试
    asyncio.run(run_backend_performance_test_simple())