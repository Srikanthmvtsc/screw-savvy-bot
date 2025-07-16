import { useState } from "react";
import { ArrowLeft, Upload, FileText, Trash2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const AdminPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  
  // Mock data for PDFs - in real app this would come from your backend
  const [pdfs] = useState([
    { id: 1, name: "Wood Screws Guide.pdf", uploadDate: "2024-12-10", size: "2.4 MB" },
    { id: 2, name: "Metal Fasteners Manual.pdf", uploadDate: "2024-12-08", size: "3.1 MB" },
    { id: 3, name: "Drywall Installation Screws.pdf", uploadDate: "2024-12-05", size: "1.8 MB" },
  ]);

  const handleFileUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      toast({
        title: "Processing PDF",
        description: "Uploading and processing your PDF file...",
        duration: 3000,
      });

      const response = await fetch('http://localhost:5000/process-pdf', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "PDF Processed Successfully",
          description: `Created ${result.chunks_processed} chunks and ${result.embeddings_created} embeddings.`,
          duration: 5000,
        });
      } else {
        throw new Error(result.error || 'Failed to process PDF');
      }
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload PDF",
        variant: "destructive",
        duration: 5000,
      });
    }
  };

  const handleDelete = (pdfName: string) => {
    toast({
      title: "Backend Integration Required", 
      description: `Connect to Supabase to delete ${pdfName}.`,
      duration: 5000,
    });
  };

  const filteredPdfs = pdfs.filter(pdf => 
    pdf.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
              <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Upload Section */}
        <Card className="mb-8 shadow-elegant">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Upload className="w-5 h-5 text-primary" />
              <span>Upload New PDF</span>
            </CardTitle>
            <CardDescription>
              Add new screw documentation to the knowledge base
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
              <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">Drag and drop files here</h3>
              <p className="text-muted-foreground mb-4">or click to browse</p>
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file);
                }}
                className="hidden"
                id="file-upload"
              />
              <Button asChild className="bg-gradient-primary">
                <label htmlFor="file-upload" className="cursor-pointer">
                  Select Files
                </label>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* PDF Management Section */}
        <Card className="shadow-elegant">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-primary" />
                  <span>PDF Knowledge Base</span>
                </CardTitle>
                <CardDescription>
                  Manage uploaded screw documentation files
                </CardDescription>
              </div>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search PDFs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredPdfs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No PDFs found matching your search.
                </div>
              ) : (
                filteredPdfs.map((pdf) => (
                  <div
                    key={pdf.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-primary-foreground" />
                      </div>
                      <div>
                        <h4 className="font-medium">{pdf.name}</h4>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <span>Uploaded: {pdf.uploadDate}</span>
                          <span>Size: {pdf.size}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(pdf.name)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminPage;