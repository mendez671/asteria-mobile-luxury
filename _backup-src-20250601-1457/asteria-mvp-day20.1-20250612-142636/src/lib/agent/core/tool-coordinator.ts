// ===============================
// WEEK 2: CORE FLOW OPTIMIZATION - Tool Coordination Framework
// NEW FILE: Coordinated tool execution with dependency management
// ===============================

interface ToolExecutionStep {
  tool: string;
  order: number;
  dependencies: string[];
  critical: boolean;
  parallelizable: boolean;
}

interface ToolExecutionPlan {
  steps: ToolExecutionStep[];
  parallel: string[][];
  critical: string[];
  estimated_time: number;
}

interface CoordinatedResult {
  success: boolean;
  results: any[];
  execution_time: number;
  steps_completed: number;
  steps_failed: number;
  context_shared: boolean;
  critical_failure?: string;
  failure_reason?: string;
  combined_data?: any;
  quality_score?: number;
}

export class ToolCoordinator {
  private executionPlan?: ToolExecutionPlan;
  private context: Map<string, any> = new Map();
  private metrics = {
    total_executions: 0,
    success_rate: 0,
    avg_time: 0
  };

  async coordinateTools(
    intent: string,
    tools: string[],
    params: any,
    agentContext: any
  ): Promise<CoordinatedResult> {
    console.log(`🔗 [TOOL-COORDINATOR] Starting coordinated execution for ${tools.length} tools`);
    console.log(`🔗 [TOOL-COORDINATOR] Intent: ${intent}, Tools: ${tools.join(', ')}`);
    
    const startTime = performance.now();
    
    try {
      // Build execution plan based on intent and tool dependencies
      this.executionPlan = this.buildExecutionPlan(intent, tools);
      
      console.log(`🔗 [TOOL-COORDINATOR] Execution plan: ${this.executionPlan.steps.length} steps`);
      
      // Execute tools in optimal order
      const results = [];
      let steps_completed = 0;
      let steps_failed = 0;
      
      for (const step of this.executionPlan.steps) {
        console.log(`🔧 [TOOL-COORDINATOR] Executing step ${step.order}: ${step.tool}`);
        
        try {
          const result = await this.executeStep(step, params, agentContext);
          results.push(result);
          steps_completed++;
          
          // Share context between tools for intelligent coordination
          this.context.set(step.tool, result);
          console.log(`✅ [TOOL-COORDINATOR] ${step.tool} completed successfully`);
          
          // Early exit on critical failure
          if (step.critical && !result.success) {
            console.error(`❌ [TOOL-COORDINATOR] Critical tool ${step.tool} failed, aborting execution`);
            return this.handleFailure(step, result, results, performance.now() - startTime);
          }
          
        } catch (error) {
          console.error(`❌ [TOOL-COORDINATOR] Tool ${step.tool} execution failed:`, error);
          steps_failed++;
          
          if (step.critical) {
            return this.handleFailure(step, { success: false, error }, results, performance.now() - startTime);
          }
        }
      }
      
      const execution_time = performance.now() - startTime;
      console.log(`🏁 [TOOL-COORDINATOR] Coordination complete: ${steps_completed}/${this.executionPlan.steps.length} tools succeeded in ${execution_time.toFixed(0)}ms`);
      
      return this.mergeResults(results, execution_time, steps_completed, steps_failed);
      
    } catch (error) {
      console.error(`❌ [TOOL-COORDINATOR] Coordination failed:`, error);
      return {
        success: false,
        results: [],
        execution_time: performance.now() - startTime,
        steps_completed: 0,
        steps_failed: tools.length,
        context_shared: false
      };
    }
  }

  private buildExecutionPlan(intent: string, tools: string[]): ToolExecutionPlan {
    // Define tool dependencies for optimal execution order
    const toolDependencies: Record<string, string[]> = {
      'create_ticket': ['search_luxury_knowledge', 'fetch_active_services'],
      'notify_concierge': ['create_ticket'],
      'stripe_payment_intent': ['create_ticket', 'fetch_active_services'],
      'amadeus_flight_search': [],
      'search_luxury_knowledge': [],
      'fetch_active_services': []
    };
    
    // Define critical tools that must succeed
    const criticalTools: Record<string, string[]> = {
      'transportation': ['search_luxury_knowledge', 'fetch_active_services'],
      'events': ['search_luxury_knowledge', 'fetch_active_services'],
      'lifestyle': ['search_luxury_knowledge'],
      'payment': ['stripe_payment_intent', 'create_ticket']
    };
    
    // Smart ordering based on dependencies
    const orderedSteps = this.topologicalSort(tools, toolDependencies);
    
    // Identify parallelizable tools
    const parallel = this.identifyParallelizable(tools, toolDependencies);
    
    return {
      steps: orderedSteps.map((tool, index) => ({
        tool,
        order: index,
        dependencies: toolDependencies[tool] || [],
        critical: criticalTools[intent]?.includes(tool) || false,
        parallelizable: parallel.some(group => group.includes(tool))
      })),
      parallel,
      critical: criticalTools[intent] || [],
      estimated_time: this.estimateExecutionTime(tools)
    };
  }
  
  private topologicalSort(tools: string[], dependencies: Record<string, string[]>): string[] {
    const visited = new Set<string>();
    const result: string[] = [];
    
    const visit = (tool: string) => {
      if (visited.has(tool)) return;
      visited.add(tool);
      
      // Visit dependencies first
      const deps = dependencies[tool] || [];
      for (const dep of deps) {
        if (tools.includes(dep)) {
          visit(dep);
        }
      }
      
      result.push(tool);
    };
    
    for (const tool of tools) {
      visit(tool);
    }
    
    return result;
  }
  
  private identifyParallelizable(tools: string[], dependencies: Record<string, string[]>): string[][] {
    // Tools that can run in parallel (no dependencies between them)
    const parallelGroups: string[][] = [];
    
    // Group tools with no dependencies
    const independentTools = tools.filter(tool => 
      (dependencies[tool] || []).length === 0
    );
    
    if (independentTools.length > 1) {
      parallelGroups.push(independentTools);
    }
    
    return parallelGroups;
  }
  
  private async executeStep(step: ToolExecutionStep, params: any, agentContext: any): Promise<any> {
    // Dynamic tool loading and execution
    try {
      const toolModule = await import(`../tools/${step.tool}`);
      
      // Enhance params with shared context from previous tools
      const enhancedParams = {
        ...params,
        chainContext: {
          ...agentContext,
          executionOrder: Array.from(this.context.keys()),
          previousResults: Object.fromEntries(this.context),
          step: step.order
        }
      };
      
      return await toolModule.execute(enhancedParams, agentContext);
      
    } catch (error) {
      console.error(`❌ [TOOL-COORDINATOR] Failed to execute ${step.tool}:`, error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
  
  private handleFailure(step: ToolExecutionStep, result: any, results: any[], execution_time: number): CoordinatedResult {
    console.error(`🚨 [TOOL-COORDINATOR] Critical failure in ${step.tool}, terminating coordination`);
    
    return {
      success: false,
      results,
      execution_time,
      steps_completed: results.length,
      steps_failed: 1,
      context_shared: this.context.size > 0,
      critical_failure: step.tool,
      failure_reason: result.error || 'Unknown error'
    };
  }
  
  private mergeResults(results: any[], execution_time: number, steps_completed: number, steps_failed: number): CoordinatedResult {
    // Intelligent result merging
    const merged = {
      success: steps_failed === 0,
      results,
      execution_time,
      steps_completed,
      steps_failed,
      context_shared: this.context.size > 0,
      combined_data: this.combineData(results),
      quality_score: this.calculateQualityScore(results, steps_completed, steps_failed)
    };
    
    console.log(`📊 [TOOL-COORDINATOR] Results merged: ${steps_completed} successful, ${steps_failed} failed, quality: ${merged.quality_score.toFixed(2)}`);
    
    return merged;
  }
  
  private combineData(results: any[]): any {
    // Combine data from multiple tools intelligently
    const combined = {
      services: [] as any[],
      knowledge: [] as any[],
      tickets: [] as any[],
      payments: [] as any[],
      notifications: [] as any[]
    };
    
    for (const result of results) {
      if (result.success && result.data) {
        if (result.data.services) combined.services.push(...result.data.services);
        if (result.data.results) combined.knowledge.push(...result.data.results);
        if (result.data.ticket) combined.tickets.push(result.data.ticket);
        if (result.data.payment_intent) combined.payments.push(result.data.payment_intent);
        if (result.data.notification) combined.notifications.push(result.data.notification);
      }
    }
    
    return combined;
  }
  
  private calculateQualityScore(results: any[], completed: number, failed: number): number {
    // Quality scoring based on execution success and data quality
    const successRate = completed / (completed + failed);
    const dataQuality = results.filter(r => r.success && r.data).length / results.length;
    
    return (successRate * 0.7) + (dataQuality * 0.3);
  }
  
  private estimateExecutionTime(tools: string[]): number {
    // Estimated execution times for tools (in ms)
    const toolTimes: Record<string, number> = {
      'search_luxury_knowledge': 800,
      'fetch_active_services': 200,
      'create_ticket': 300,
      'amadeus_flight_search': 1500,
      'stripe_payment_intent': 500,
      'notify_concierge': 100
    };
    
    return tools.reduce((total, tool) => total + (toolTimes[tool] || 500), 0);
  }
  
  // Metrics and monitoring
  getMetrics() {
    return this.metrics;
  }
  
  updateMetrics(execution_time: number, success: boolean) {
    this.metrics.total_executions++;
    this.metrics.success_rate = (this.metrics.success_rate * (this.metrics.total_executions - 1) + (success ? 1 : 0)) / this.metrics.total_executions;
    this.metrics.avg_time = (this.metrics.avg_time * (this.metrics.total_executions - 1) + execution_time) / this.metrics.total_executions;
  }
} 