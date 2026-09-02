import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export const generateBookingPDF = async (booking) => {
  const input = document.getElementById("booking-receipt");
  if (!input) return;

  const canvas = await html2canvas(input, {
    scale: 2,
    useCORS: true,
    logging: false,
    windowWidth: input.scrollWidth,
    windowHeight: input.scrollHeight,
  });

  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF("p", "mm", "a4");

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  const margin = 10;
  let imgWidth = pageWidth - margin * 2;
  let imgHeight = (canvas.height * imgWidth) / canvas.width;

  const maxHeight = pageHeight - margin * 2;
  if (imgHeight > maxHeight) {
    const scaleFactor = maxHeight / imgHeight;
    imgHeight = maxHeight;
    imgWidth = imgWidth * scaleFactor;
  }

  const xOffset = (pageWidth - imgWidth) / 2;

  pdf.addImage(imgData, "PNG", xOffset, margin, imgWidth, imgHeight);
  pdf.save(`TravelTribe-Receipt-${booking.receiptId || booking._id}.pdf`);
};
