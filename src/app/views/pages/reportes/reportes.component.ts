import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DirectorioService, Dependencia } from '../../../services/directorio.service';

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reportes.component.html',
  styleUrls: ['./reportes.component.scss'],
})
export class ReportesComponent implements OnInit {
  dependencias: Dependencia[] = [];
  loadingDeps = false;

  depIdDirectivos = 0;
  descargandoDirectivos = false;

  depIdGeneral = 0;
  descargandoGeneral = false;

  error: string | null = null;

  constructor(private directorioService: DirectorioService) {}

  ngOnInit(): void {
    this.loadingDeps = true;
    this.directorioService.getDependencias().subscribe({
      next: data => { this.dependencias = data; this.loadingDeps = false; },
      error: () => { this.error = 'No se pudo cargar dependencias'; this.loadingDeps = false; },
    });
  }

  descargarDirectivos(): void {
    this.descargandoDirectivos = true;
    this.error = null;
    this.directorioService.descargarReporteDirectivos(this.depIdDirectivos).subscribe({
      next: blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'Reporte Directivos.pdf';
        a.click();
        URL.revokeObjectURL(url);
        this.descargandoDirectivos = false;
      },
      error: () => { this.error = 'Error al generar el reporte'; this.descargandoDirectivos = false; },
    });
  }

  descargarGeneral(): void {
    this.descargandoGeneral = true;
    this.error = null;
    this.directorioService.descargarPdf(this.depIdGeneral).subscribe({
      next: blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'Directorio Telefónico.pdf';
        a.click();
        URL.revokeObjectURL(url);
        this.descargandoGeneral = false;
      },
      error: () => { this.error = 'Error al generar el reporte'; this.descargandoGeneral = false; },
    });
  }
}
