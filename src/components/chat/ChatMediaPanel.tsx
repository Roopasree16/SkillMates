import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { X, Link2, Image, FileText, ExternalLink, Download } from "lucide-react";

interface Message {
  id: string;
  content: string | null;
  message_type: string;
  file_url: string | null;
  file_name: string | null;
  file_type: string | null;
  created_at: string;
}

interface ChatMediaPanelProps {
  messages: Message[];
  onClose: () => void;
}

const ChatMediaPanel = ({ messages, onClose }: ChatMediaPanelProps) => {
  // Extract links from text messages
  const extractLinks = (text: string): string[] => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.match(urlRegex) || [];
  };

  // Get all links from messages
  const links = messages
    .filter((m) => m.message_type === "text" && m.content)
    .flatMap((m) => {
      const foundLinks = extractLinks(m.content!);
      return foundLinks.map((link) => ({
        id: m.id,
        url: link,
        date: m.created_at,
      }));
    });

  // Get all images
  const images = messages.filter(
    (m) =>
      m.message_type === "file" &&
      m.file_type?.startsWith("image/") &&
      m.file_url
  );

  // Get all documents (non-image files)
  const documents = messages.filter(
    (m) =>
      (m.message_type === "file" && !m.file_type?.startsWith("image/") && m.file_url) ||
      (m.message_type === "voice" && m.file_url)
  );

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="w-80 border-l border-border bg-background flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h3 className="font-semibold text-foreground">Shared Media</h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      <Tabs defaultValue="links" className="flex-1 flex flex-col">
        <TabsList className="w-full justify-start px-4 pt-2">
          <TabsTrigger value="links" className="flex items-center gap-1">
            <Link2 className="w-3 h-3" />
            Links ({links.length})
          </TabsTrigger>
          <TabsTrigger value="images" className="flex items-center gap-1">
            <Image className="w-3 h-3" />
            Images ({images.length})
          </TabsTrigger>
          <TabsTrigger value="docs" className="flex items-center gap-1">
            <FileText className="w-3 h-3" />
            Docs ({documents.length})
          </TabsTrigger>
        </TabsList>

        <ScrollArea className="flex-1">
          <TabsContent value="links" className="p-4 m-0">
            {links.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No links shared yet
              </p>
            ) : (
              <div className="space-y-3">
                {links.map((link, idx) => (
                  <a
                    key={`${link.id}-${idx}`}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-3 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                  >
                    <div className="flex items-start gap-2">
                      <ExternalLink className="w-4 h-4 mt-0.5 text-primary shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-foreground truncate">
                          {link.url}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDate(link.date)}
                        </p>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="images" className="p-4 m-0">
            {images.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No images shared yet
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {images.map((img) => (
                  <a
                    key={img.id}
                    href={img.file_url!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative aspect-square rounded-lg overflow-hidden bg-muted hover:opacity-90 transition-opacity"
                  >
                    <img
                      src={img.file_url!}
                      alt={img.file_name || "Shared image"}
                      className="w-full h-full object-cover"
                    />
                  </a>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="docs" className="p-4 m-0">
            {documents.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No documents shared yet
              </p>
            ) : (
              <div className="space-y-2">
                {documents.map((doc) => (
                  <a
                    key={doc.id}
                    href={doc.file_url!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-foreground truncate">
                        {doc.file_name || "Document"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(doc.created_at)}
                      </p>
                    </div>
                    <Download className="w-4 h-4 text-muted-foreground" />
                  </a>
                ))}
              </div>
            )}
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );
};

export default ChatMediaPanel;
