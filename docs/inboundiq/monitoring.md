# InboundIQ (Heimdall) — Monitoring & Alerting

## Key Metrics

### Operational Metrics

| Metric | Description | Target | CloudWatch Namespace |
|--------|-------------|--------|---------------------|
| **Truck TAT P95** | 95th percentile turnaround time (pre-checkin → check-out) | ≤ 2.5 hours | InboundIQ/Operations |
| **Dwell Hours Distribution** | Distribution of yard dwell times across buckets | < 10% trucks > 12h | InboundIQ/Operations |
| **On-Time Arrival %** | Percentage of trucks arriving within their appointment window | ≥ 85% | InboundIQ/Operations |
| **Dock Door Utilization %** | Average percentage of doors occupied during operating hours | 75–90% | InboundIQ/Operations |
| **Yard Queue Depth** | Number of trucks in yard (Arrived + PreCheckin) per FC | ≤ 1.5× door count | InboundIQ/Operations |
| **HOT Truck Wait Time** | Average dwell time for HOT appointment trucks | ≤ 1 hour | InboundIQ/Operations |
| **Appointment Closure Rate** | Appointments closed per hour during peak | ≥ 8/hr per FC | InboundIQ/Operations |

### System Metrics

| Metric | Description | Target | CloudWatch Namespace |
|--------|-------------|--------|---------------------|
| **API Latency P99** | 99th percentile API response time | ≤ 500ms | InboundIQ/API |
| **API Error Rate** | Percentage of 5xx responses | < 0.1% | InboundIQ/API |
| **Lambda Duration P95** | 95th percentile Lambda execution time | ≤ 3 seconds | InboundIQ/Compute |
| **Lambda Error Count** | Number of Lambda invocation errors per hour | ≤ 5 | InboundIQ/Compute |
| **RDS CPU Utilization** | Database CPU percentage | < 70% | AWS/RDS |
| **RDS Free Storage** | Available storage space | > 20 GB | AWS/RDS |
| **RDS Connections** | Active database connections | < 80% of max | AWS/RDS |
| **Event Processing Lag** | Time between SNS publish and RDS write | ≤ 2 seconds | InboundIQ/Pipeline |
| **DLQ Message Count** | Messages in dead-letter queue | = 0 | InboundIQ/Pipeline |
| **Ranking Refresh Latency** | Time to recompute yard rankings | ≤ 2 minutes | InboundIQ/Compute |

---

## CloudWatch Alarm Configuration

### Critical Alarms (Page On-Call)

```yaml
TruckTATP95Alarm:
  MetricName: TruckTurnaroundTimeP95
  Namespace: InboundIQ/Operations
  Statistic: p95
  Period: 300  # 5 minutes
  EvaluationPeriods: 3
  Threshold: 4.0  # hours
  ComparisonOperator: GreaterThanThreshold
  AlarmActions: [SNS:inboundiq-oncall-critical]
  Description: "Truck TAT P95 exceeds 4 hours for 15 minutes"

APIErrorRateAlarm:
  MetricName: 5XXError
  Namespace: InboundIQ/API
  Statistic: Average
  Period: 60
  EvaluationPeriods: 5
  Threshold: 0.05  # 5%
  ComparisonOperator: GreaterThanThreshold
  AlarmActions: [SNS:inboundiq-oncall-critical]
  Description: "API 5xx error rate exceeds 5% for 5 minutes"

DLQMessageAlarm:
  MetricName: ApproximateNumberOfMessagesVisible
  Namespace: AWS/SQS
  QueueName: inboundiq-dlq
  Statistic: Sum
  Period: 60
  EvaluationPeriods: 1
  Threshold: 0
  ComparisonOperator: GreaterThanThreshold
  AlarmActions: [SNS:inboundiq-oncall-critical]
  Description: "Messages detected in dead-letter queue"

RDSCPUAlarm:
  MetricName: CPUUtilization
  Namespace: AWS/RDS
  DBInstanceIdentifier: inboundiq-prod
  Statistic: Average
  Period: 300
  EvaluationPeriods: 3
  Threshold: 85
  ComparisonOperator: GreaterThanThreshold
  AlarmActions: [SNS:inboundiq-oncall-critical]
  Description: "RDS CPU utilization exceeds 85% for 15 minutes"
```

### Warning Alarms (Notify Channel)

```yaml
YardQueueDepthAlarm:
  MetricName: YardQueueDepth
  Namespace: InboundIQ/Operations
  Dimensions: [{ Name: FcId, Value: "*" }]
  Statistic: Maximum
  Period: 300
  EvaluationPeriods: 6  # 30 minutes
  Threshold: 25
  ComparisonOperator: GreaterThanThreshold
  AlarmActions: [SNS:inboundiq-warnings]
  Description: "Yard queue exceeds 25 trucks at any FC for 30 minutes"

HOTTruckWaitAlarm:
  MetricName: HOTTruckAvgDwell
  Namespace: InboundIQ/Operations
  Statistic: Average
  Period: 300
  EvaluationPeriods: 3
  Threshold: 2.0  # hours
  ComparisonOperator: GreaterThanThreshold
  AlarmActions: [SNS:inboundiq-warnings]
  Description: "HOT truck average dwell exceeds 2 hours for 15 minutes"

DockUtilizationLowAlarm:
  MetricName: DockDoorUtilization
  Namespace: InboundIQ/Operations
  Statistic: Average
  Period: 3600  # 1 hour
  EvaluationPeriods: 2
  Threshold: 50  # percent
  ComparisonOperator: LessThanThreshold
  AlarmActions: [SNS:inboundiq-warnings]
  Description: "Dock utilization below 50% for 2 hours — possible scheduling gap"

EventProcessingLagAlarm:
  MetricName: EventProcessingLatency
  Namespace: InboundIQ/Pipeline
  Statistic: p99
  Period: 300
  EvaluationPeriods: 3
  Threshold: 10  # seconds
  ComparisonOperator: GreaterThanThreshold
  AlarmActions: [SNS:inboundiq-warnings]
  Description: "Event processing lag P99 exceeds 10 seconds"

LambdaDurationAlarm:
  MetricName: Duration
  Namespace: AWS/Lambda
  FunctionName: inboundiq-ranking-engine
  Statistic: p95
  Period: 300
  EvaluationPeriods: 3
  Threshold: 5000  # 5 seconds in ms
  ComparisonOperator: GreaterThanThreshold
  AlarmActions: [SNS:inboundiq-warnings]
  Description: "Ranking engine P95 latency exceeds 5 seconds"

RDSStorageAlarm:
  MetricName: FreeStorageSpace
  Namespace: AWS/RDS
  DBInstanceIdentifier: inboundiq-prod
  Statistic: Minimum
  Period: 3600
  EvaluationPeriods: 1
  Threshold: 10737418240  # 10 GB in bytes
  ComparisonOperator: LessThanThreshold
  AlarmActions: [SNS:inboundiq-warnings]
  Description: "RDS free storage below 10 GB"
```

---

## CloudWatch Dashboard

### Recommended Dashboard Widgets

**Row 1 — Headlines:**
- Truck TAT P95 (Number widget, large)
- Dock Utilization % (Gauge widget)
- Active Yard Queue (Number widget)
- API Error Rate (Number widget)

**Row 2 — Operational Trends:**
- TAT P95 over 7 days (Line chart)
- Yard Queue Depth by FC (Stacked area chart)
- HOT Truck Wait Time (Line chart)
- Appointment Closures per Hour (Bar chart)

**Row 3 — System Health:**
- API Latency P50/P95/P99 (Line chart)
- Lambda Invocations + Errors (Stacked bar)
- RDS CPU + Connections (Line chart)
- Event Processing Lag (Line chart)

**Row 4 — Pipeline:**
- DLQ Message Count (Number widget, red if > 0)
- Events Processed per Minute (Line chart)
- Ranking Refresh Latency (Line chart)

---

## Runbook Triggers

| Alarm | First Response |
|-------|---------------|
| Truck TAT P95 > 4h | Check yard queue depth per FC. Identify if a specific FC is backed up. Look for stuck appointments (no state transition > 2h). |
| API 5xx > 5% | Check Lambda error logs. Verify RDS connectivity. Check for deployment in progress. |
| DLQ messages > 0 | Inspect DLQ messages for error pattern. Check source SNS topic health. Redrive after root cause fix. |
| RDS CPU > 85% | Check slow query log. Look for full table scans. Consider read replica if query volume is the cause. |
| Yard queue > 25 | Contact FC ops to verify if doors are being released on time. Check for door maintenance or equipment issues. |
| HOT dwell > 2h | Escalate to FC shift lead. Verify HOT trucks are being prioritized in the ranking output. |
| Event lag > 10s | Check Lambda concurrency limits. Verify SQS queue is not throttled. Check for Lambda cold starts. |
