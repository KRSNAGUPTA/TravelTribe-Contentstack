import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export const generateBookingPDF = async (booking) => {
  const input = document.getElementById("booking-receipt");

  const canvas = await html2canvas(input, { scale: 2 });
  const imgData = canvas.toDataURL("image/png");

  const pdf = new jsPDF("p", "mm", "a4");

  const pageWidth = pdf.internal.pageSize.getWidth();
  //   const pageHeight = pdf.internal.pageSize.getHeight();

  const margin = 10;
  const imgWidth = pageWidth - margin * 2;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  pdf.addImage(imgData, "PNG", margin, margin, imgWidth, imgHeight);

  pdf.save(`Travel Tribe - Booking Receipt-${booking.receiptId}.pdf`);
};
