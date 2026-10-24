/** 与专家插件保持一致的设置栏图标。 */
import React from 'react';
import * as primitives from '@deepseek-ai/dsh-client-ui-primitives';

export function GithubMark16(): React.ReactElement {
  return React.createElement('svg', { viewBox: '0 0 16 16', width: 16, height: 16, 'aria-hidden': true, focusable: false },
    React.createElement('path', { fill: 'currentColor', d: 'M8 0a8 8 0 0 0-2.53 15.59c.4.074.547-.173.547-.385 0-.19-.007-.693-.01-1.36-2.226.484-2.695-1.073-2.695-1.073-.364-.924-.89-1.17-.89-1.17-.726-.496.055-.486.055-.486.803.056 1.225.824 1.225.824.714 1.223 1.872.87 2.328.665.072-.517.28-.87.508-1.07-1.777-.202-3.645-.888-3.645-3.956 0-.874.31-1.588.823-2.148-.083-.202-.357-1.017.078-2.12 0 0 .672-.215 2.2.82A7.65 7.65 0 0 1 8 4.8c.68.003 1.365.092 2.004.27 1.527-1.035 2.197-.82 2.197-.82.437 1.103.162 1.918.08 2.12.513.56.822 1.274.822 2.148 0 3.076-1.872 3.752-3.654 3.95.288.248.544.735.544 1.482 0 1.07-.01 1.932-.01 2.195 0 .214.144.463.55.384A8.001 8.001 0 0 0 8 0Z' }))
}

const IconEditOutlineRegular = (primitives as Record<string, unknown>).IconEditOutlineRegular as React.ComponentType<{ size?: number }> | undefined;

export function FeedbackMark16(): React.ReactElement {
  if (typeof IconEditOutlineRegular === 'function') {
    return React.createElement(IconEditOutlineRegular, { size: 16 });
  }
  return React.createElement('svg', { viewBox: '0 0 16 16', width: 16, height: 16, 'aria-hidden': true, focusable: false },
    React.createElement('path', { fill: 'currentColor', d: 'M11.06 1.94a1.5 1.5 0 0 1 2.12 2.12l-8.5 8.5a1.5 1.5 0 0 1-.64.38l-2.5.71a.5.5 0 0 1-.61-.61l.71-2.5a1.5 1.5 0 0 1 .38-.64l8.5-8.5Z' }));
}
