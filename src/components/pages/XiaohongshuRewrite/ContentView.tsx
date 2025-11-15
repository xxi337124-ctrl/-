'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { XhsNote } from './index';

interface ContentViewProps {
  note: XhsNote;
  onStartRewrite: () => void;
  onBack: () => void;
}

export default function ContentView({ note, onStartRewrite, onBack }: ContentViewProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">查看内容</h2>
          <p className="text-gray-600">确认要二创的内容，点击开始二创按钮</p>
        </div>
        <Button variant="outline" onClick={onBack}>
          返回
        </Button>
      </div>

      <Card onClick={(e) => e.stopPropagation()}>
        <CardHeader>
          <CardTitle className="text-xl">{note.title}</CardTitle>
          <div className="flex items-center gap-4 text-sm text-gray-500 mt-2">
            <span>❤️ {note.likes} 点赞</span>
            <span>💬 {note.comments} 评论</span>
            {note.author && <span>👤 {note.author}</span>}
          </div>
        </CardHeader>
        <CardContent className="space-y-4" onClick={(e) => e.stopPropagation()}>
          {/* 图片展示 */}
          {note.images.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-700 mb-3">图片 ({note.images.length} 张)</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {note.images.map((image, index) => (
                  <div
                    key={index}
                    className="aspect-square rounded-lg overflow-hidden bg-gray-100"
                  >
                    <img
                      src={image}
                      alt={`图片 ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 文案内容 */}
          <div>
            <h3 className="font-semibold text-gray-700 mb-3">文案内容</h3>
            <div className="p-4 bg-gray-50 rounded-lg min-h-[100px]">
              {note.content && note.content.trim() ? (
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{note.content}</p>
              ) : (
                <p className="text-gray-400 italic">该笔记暂无文字内容</p>
              )}
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={onStartRewrite}
              className="flex-1 bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600"
              size="lg"
            >
              🚀 开始二创
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

