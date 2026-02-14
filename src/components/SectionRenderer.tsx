import * as React from "react";
import { Card } from "@/components/ui/card";
import ChemicalBlock from "@/components/ChemicalBlock";
import TableBlock from "@/components/TableBlock";
import MCQBlock from "@/components/MCQBlock";
import ImageBlock from "@/components/ImageBlock";
import VideoBlock from "@/components/VideoBlock";
import FormulaBlock from "@/components/FormulaBlock";
// Figure block removed - no image generation system
import ReactionBlock from "@/components/ReactionBlock";
import DiagramBlock from "@/components/DiagramBlock";
import HighlightBlock from "@/components/HighlightBlock";
import DefinitionBlock from "@/components/DefinitionBlock";
import { parseTextForBold, formatChemicalNotation } from "@/lib/utils/textFormatter";
import type { NotesData } from "@/lib/ai/schemas";

type NotesSection = NotesData["sections"][number];

// Helper component to render formatted text with improved typography
function FormattedText({ text }: { text: string }) {
  const formattedText = formatChemicalNotation(text);
  const parts = parseTextForBold(formattedText);
  
  return (
    <>
      {parts.map((part, index) =>
        part.bold ? (
          <strong key={index} className="font-semibold text-slate-900">
            {part.text}
          </strong>
        ) : (
          <React.Fragment key={index}>{part.text}</React.Fragment>
        )
      )}
    </>
  );
}

// Clean, professional section styling for Quick Revision Notes
// Less visual noise, better scannability
export default function SectionRenderer({ section, index = 0 }: { section: NotesSection; index?: number }) {
  // First section (title) gets special treatment
  const isTitle = index === 0;
  
  return (
    <Card 
      id={section.id} 
      className={`p-6 md:p-8 ${
        isTitle 
          ? 'bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-2 border-blue-300 dark:border-blue-700' 
          : 'bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700'
      } shadow-sm hover:shadow-md transition-shadow`}
    >
      <h2 className={`text-2xl md:text-3xl font-bold ${
        isTitle 
          ? 'text-blue-900 dark:text-blue-100' 
          : 'text-slate-900 dark:text-slate-100'
      } mb-6 tracking-tight flex items-center gap-3`}>
        {!isTitle && <span className="text-teal-600 dark:text-teal-400">📌</span>}
        {section.title}
      </h2>
      <div className="mt-6 space-y-6 max-w-4xl">
        {section.blocks.map((block, blockIndex) => {
          if (block.type === "paragraph") {
            return (
              <p key={blockIndex} className="text-base leading-relaxed text-slate-700 font-normal">
                <FormattedText text={block.text} />
              </p>
            );
          }
          if (block.type === "bullets") {
            return (
              <ul key={blockIndex} className="list-disc pl-6 text-base text-slate-700 space-y-3">
                {block.items.map((item, idx) => (
                  <li key={idx} className="leading-relaxed font-normal">
                    <FormattedText text={item} />
                  </li>
                ))}
              </ul>
            );
          }
          if (block.type === "table") {
            return <TableBlock key={blockIndex} headers={block.headers} rows={block.rows} caption={block.caption} gpatNote={block.gpatNote} />;
          }
          if (block.type === "chemicals") {
            return <ChemicalBlock key={blockIndex} items={block.items} />;
          }
          if (block.type === "mcq") {
            return (
              <MCQBlock
                key={blockIndex}
                question={block.question}
                options={block.options}
                correctOptionId={block.correctOptionId}
                explanation={block.explanation}
              />
            );
          }
          if (block.type === "image") {
            return (
              <ImageBlock
                key={blockIndex}
                url={block.url}
                alt={block.alt}
                caption={block.caption}
                source={block.source}
                license={block.license}
              />
            );
          }
          if (block.type === "video") {
            return (
              <VideoBlock
                key={blockIndex}
                videoId={block.videoId}
                title={block.title}
                description={block.description}
              />
            );
          }
          if (block.type === "formula") {
            return (
              <FormulaBlock
                key={blockIndex}
                title={block.title}
                formula={block.formula}
                description={block.description}
                gpatTip={block.gpatTip}
              />
            );
          }
          // Figure block removed - no image generation system
          if (block.type === "figure") {
            return null; // Skip figure blocks
          }
          if (block.type === "reaction") {
            return (
              <ReactionBlock
                key={blockIndex}
                name={block.name}
                equation={block.equation}
                conditions={block.conditions}
                description={block.description}
                note={block.note}
                reactantStructure={block.reactantStructure}
                productStructure={block.productStructure}
                structureVariant={block.structureVariant}
              />
            );
          }
          if (block.type === "diagram") {
            return (
              <DiagramBlock
                key={blockIndex}
                diagramType={block.diagramType}
                title={block.title}
                description={block.description}
                caption={block.caption}
                gpatAngle={block.gpatAngle}
                keyRecall={block.keyRecall}
                svgAsset={block.svgAsset}
              />
            );
          }
          if (block.type === "highlight") {
            return (
              <HighlightBlock
                key={blockIndex}
                style={block.style}
                title={block.title}
                content={block.content}
              />
            );
          }
          if (block.type === "definition") {
            return (
              <DefinitionBlock
                key={blockIndex}
                term={block.term}
                definition={block.definition}
              />
            );
          }
          return null;
        })}
      </div>
    </Card>
  );
}
