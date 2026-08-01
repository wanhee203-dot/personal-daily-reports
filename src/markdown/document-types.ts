export type MarkdownBlock =
  | {
      type: "heading";
      level: 1 | 2 | 3;
      text: string;
    }
  | {
      type: "paragraph";
      text: string;
    }
  | {
      type: "list";
      ordered: boolean;
      items: string[];
    }
  | {
      type: "blockquote";
      text: string;
    }
  | {
      type: "code";
      language?: string;
      code: string;
    }
  | {
      type: "image";
      alt: string;
      src: string;
    };

export interface MarkdownDocument {
  title: string;
  blocks: MarkdownBlock[];
}

export interface PosterDocument extends MarkdownDocument {
  dateLabel: string;
  sourceName: string;
}
