import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

interface Extension {
  id?: number;
  extensionPublica: string;
  extensionPersonal: string;
  servidorPublico: string;
  ubicacion: string;
}

@Component({
  selector: 'app-extensiones',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './extensiones.component.html',
  styleUrls: ['./extensiones.component.scss']
})
export class ExtensionesComponent implements OnInit {
  extensiones: Extension[] = [];
  filteredExtensiones: Extension[] = [];
  searchTerm: string = '';
  
  // Paginación
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalItems: number = 0;
  
  constructor() { }

  ngOnInit(): void {
    this.loadExtensiones();
  }

  loadExtensiones(): void {
    // Aquí llamarías a tu servicio
    this.extensiones = [
      { extensionPublica: '4203', extensionPersonal: '4203', servidorPublico: 'ZARZA VALDÉS FERNANDO', ubicacion: 'CONTRALORÍA' },
      { extensionPublica: '4003', extensionPersonal: '4003', servidorPublico: 'GARCÍA VILLA ESMERALDA', ubicacion: 'CONTRALORÍA' },
      // ... más datos
    ];
    this.totalItems = 352; // Total de registros
    this.filteredExtensiones = [...this.extensiones];
  }

  onSearch(): void {
    if (!this.searchTerm) {
      this.filteredExtensiones = [...this.extensiones];
      return;
    }
    
    this.filteredExtensiones = this.extensiones.filter(ext => 
      ext.servidorPublico.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      ext.extensionPublica.includes(this.searchTerm) ||
      ext.ubicacion.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  onItemsPerPageChange(): void {
    this.currentPage = 1;
    // Aquí recargarías los datos con el nuevo tamaño de página
  }

  agregarExtension(): void {
    // Lógica para agregar nueva extensión
    console.log('Agregar nueva extensión');
  }

  editarExtension(extension: Extension): void {
    console.log('Editar extensión', extension);
  }

  eliminarExtension(extension: Extension): void {
    if (confirm('¿Está seguro de eliminar esta extensión?')) {
      console.log('Eliminar extensión', extension);
    }
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    // Aquí recargarías los datos de la nueva página
  }
}