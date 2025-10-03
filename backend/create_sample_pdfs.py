from reportlab.pdfgen import canvas
import os

def create_sample_pdf(filename, title, content):
    c = canvas.Canvas(filename)
    c.setFont("Helvetica", 12)
    c.drawString(100, 750, f"AKTU Study Notes - {title}")
    c.drawString(100, 730, "This is protected content. Downloading is disabled.")
    c.drawString(100, 710, content)
    c.save()

# Create uploads directory if it doesn't exist
if not os.path.exists('uploads'):
    os.makedirs('uploads')

# Create sample PDFs
create_sample_pdf('uploads/sample1.pdf', 'Machine Learning', 'Introduction to ML concepts...')
create_sample_pdf('uploads/sample2.pdf', 'Deep Learning', 'Deep Neural Networks explained...')
create_sample_pdf('uploads/sample3.pdf', 'Computer Organization', 'COA basics and fundamentals...')

print("Sample PDFs created!")