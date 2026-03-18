import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Target } from "lucide-react";

export default function TableBlock({
  headers,
  rows,
  caption,
  examNote,
}: {
  headers: string[];
  rows: string[][];
  caption?: string;
  examNote?: string;
}) {
  return (
    <div className="my-6">
      <div className="overflow-x-auto rounded-xl border-2 border-slate-200 bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-gradient-to-r from-blue-50 to-purple-50 hover:from-blue-50 hover:to-purple-50">
              {headers.map((header, index) => (
                <TableHead
                  key={index}
                  className="font-bold text-slate-900 border-r border-slate-200 last:border-r-0"
                >
                  {header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, rowIndex) => (
              <TableRow
                key={rowIndex}
                className="hover:bg-slate-50 transition-colors"
              >
                {row.map((cell, cellIndex) => (
                  <TableCell
                    key={cellIndex}
                    className="border-r border-slate-200 last:border-r-0 text-slate-700"
                  >
                    {cell}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        {/* Caption */}
        {caption && (
          <div className="px-4 py-2 bg-slate-50 border-t border-slate-200">
            <p className="text-xs text-slate-600 italic text-center">{caption}</p>
          </div>
        )}
      </div>

      {/* NEET Exam Note */}
      {examNote && (
        <div className="mt-3 flex items-start gap-2 p-3 rounded bg-purple-50 border border-purple-200">
          <Target className="h-4 w-4 text-purple-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-purple-800">{examNote}</p>
        </div>
      )}
    </div>
  );
}
