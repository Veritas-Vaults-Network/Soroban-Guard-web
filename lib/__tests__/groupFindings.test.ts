import { describe, it, expect } from 'vitest'
import { groupByFunction } from '../groupFindings'
import type { Finding } from '@/types/findings'

describe('groupByFunction', () => {
  it('groups findings by function name', () => {
    const findings: Finding[] = [
      {
        check_name: 'test1',
        severity: 'High',
        file_path: 'file1.rs',
        line: 10,
        function_name: 'transfer',
        description: 'desc1'
      },
      {
        check_name: 'test2',
        severity: 'Medium',
        file_path: 'file1.rs',
        line: 20,
        function_name: 'transfer',
        description: 'desc2'
      },
      {
        check_name: 'test3',
        severity: 'Low',
        file_path: 'file2.rs',
        line: 30,
        function_name: 'approve',
        description: 'desc3'
      }
    ]

    const result = groupByFunction(findings)
    expect(result['transfer']).toHaveLength(2)
    expect(result['approve']).toHaveLength(1)
    expect(result['transfer'][0].check_name).toBe('test1')
    expect(result['approve'][0].check_name).toBe('test3')
  })

  it('handles empty findings array', () => {
    const result = groupByFunction([])
    expect(result).toEqual({})
  })

  it('trims function names', () => {
    const findings: Finding[] = [
      {
        check_name: 'test1',
        severity: 'High',
        file_path: 'file1.rs',
        line: 10,
        function_name: '  transfer  ',
        description: 'desc1'
      }
    ]

    const result = groupByFunction(findings)
    expect(result['transfer']).toHaveLength(1)
    expect(result['  transfer  ']).toBeUndefined()
  })

  it('uses "Unknown function" for empty function names', () => {
    const findings: Finding[] = [
      {
        check_name: 'test1',
        severity: 'High',
        file_path: 'file1.rs',
        line: 10,
        function_name: '',
        description: 'desc1'
      },
      {
        check_name: 'test2',
        severity: 'Low',
        file_path: 'file2.rs',
        line: 20,
        function_name: '   ',
        description: 'desc2'
      }
    ]

    const result = groupByFunction(findings)
    expect(result['Unknown function']).toHaveLength(2)
  })

  it('handles multiple groups', () => {
    const findings: Finding[] = [
      {
        check_name: 'a',
        severity: 'Critical',
        file_path: 'f1.rs',
        line: 1,
        function_name: 'func_a',
        description: 'desc'
      },
      {
        check_name: 'b',
        severity: 'High',
        file_path: 'f1.rs',
        line: 2,
        function_name: 'func_b',
        description: 'desc'
      },
      {
        check_name: 'c',
        severity: 'Medium',
        file_path: 'f1.rs',
        line: 3,
        function_name: 'func_c',
        description: 'desc'
      }
    ]

    const result = groupByFunction(findings)
    expect(Object.keys(result)).toHaveLength(3)
    expect(result['func_a']).toHaveLength(1)
    expect(result['func_b']).toHaveLength(1)
    expect(result['func_c']).toHaveLength(1)
  })
})
