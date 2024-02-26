import { Component, Input, OnInit, Renderer2, ElementRef } from '@angular/core';
import { Chart, ChartType } from 'chart.js/auto';
import { GestionApiService } from 'src/app/services/gestion-api.service';

@Component({
  selector: 'app-bar-chart',
  templateUrl: './bar-chart.component.html',
  styleUrls: ['./bar-chart.component.scss'],
})
export class BarChartComponent implements OnInit {

  //Inputs recibidos de home.html
  @Input() backgroundColorCategorias: string[] = [];
  @Input() borderColorCategorias: string[] = [];
  @Input() categorias: string[] = [];
  @Input() tipoDeChartSeleccionado: string = "";

  // Atributo que almacena los datos del chart
  public chart!: Chart;

  //Creamos un objeto de este estilo para poder mostrar los valores de categoria y totalResults:
  public apiData: { categoria: string; totalResults: number }[] = [];

  constructor(public gestionServiceApi: GestionApiService, private elementRef: ElementRef, private renderer: Renderer2) {}

  ngOnInit(): void {
    console.log("Ejecuta bar-chart");
    this.inicializarChart();

    //Nos suscribimos al observable de tipo BehaviorSubject y cuando este emita un valor, recibiremos una notificación con el nuevo valor.
    this.gestionServiceApi.datos$.subscribe((datos) => {
      if (datos != undefined) {
        this.actualizarValoresChart(datos.categoria, datos.totalResults);
        this.actualizarChart();
      }
    });
  }


  //Método para comprobar si una categoría existe
  private actualizarValoresChart(categoria: string, totalResults: number) {
    const existingData = this.apiData.find(item => item.categoria === categoria);

    if (existingData) {
      // Si esa categoría existe, actualiza el valor
      existingData.totalResults = totalResults;
    } else {
      // Si esa categoría no existe, haremos el .push en apiData
      this.apiData.push({ categoria, totalResults });
    }
  }

  //Método que actualiza la gráfica
  private actualizarChart() {
    // Actualiza solo los datos del gráfico sin volver a crearlo
    const datasetsByCompany: { [key: string]: { label: string; data: number[]; backgroundColor: string[]; borderColor: string[]; borderWidth: number } } = {};

    this.apiData.forEach((row: { categoria: string; totalResults: number }, index: number) => {
      const { categoria, totalResults } = row;

      if (!datasetsByCompany[categoria]) {
        datasetsByCompany[categoria] = {
          label: 'Valores de ' + categoria,
          data: [],
          backgroundColor: [this.backgroundColorCategorias[index]],
          borderColor: [this.borderColorCategorias[index]],
          borderWidth: 1
        };
      }

      datasetsByCompany[categoria].data[index] = totalResults;
      datasetsByCompany[categoria].backgroundColor[index] = this.backgroundColorCategorias[index];
      datasetsByCompany[categoria].borderColor[index] = this.borderColorCategorias[index];
    });

    // Actualiza los datos del gráfico
    this.chart.data.labels = this.apiData.map((row: { categoria: string; totalResults: number }) => row.categoria);
    this.chart.data.datasets = Object.values(datasetsByCompany);
    // Actualiza el gráfico
    this.chart.update(); 
  }

  //Método que crea la estructura inicial del gráfico y crea el canvas automático
  private inicializarChart() {
    const datasetsByCompany: { [key: string]:
      {
        label: string;
        data: number[];
        backgroundColor: string[];
        borderColor: string[];
        borderWidth: number;
      } 
    } = {};
  
    // Si el gráfico no está inicializado, entonces la creamos sin datos ni colores
    if (!this.chart) {
      this.apiData.forEach((row: { categoria: string; totalResults: number }) => {
        const { categoria } = row;
  
        if (!datasetsByCompany[categoria]) {
          datasetsByCompany[categoria] = {
            label: 'Valores de ' + categoria,
            data: [],
            backgroundColor: [],
            borderColor: [],
            borderWidth: 1
          };
        }
      });
  
      //Formateamos el objeto para que nos guarde en formato array de json [{},{}]
      const datasets = Object.values(datasetsByCompany);

      // Creamos la gráfica (canvas)
      const canvas = this.renderer.createElement('canvas');
      //Le añadimos una id al canvas
      this.renderer.setAttribute(canvas, 'id', 'bar-chart');
    
      // Añadimos el canvas al div con id "contenedor-barchart"
      const container = this.elementRef.nativeElement.querySelector('#contenedor-barchart');
      //Añadimos el canvas al container
      this.renderer.appendChild(container, canvas);
 
      this.chart = new Chart(canvas, {
        type: 'bar' as ChartType,
        data: {
          labels: this.apiData.map((row: { categoria: string; totalResults: number }) => row.categoria),
          datasets: datasets
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true
            }
          },
          plugins: {
            legend: {
              labels: {
                font: {
                  size: 16,
                  weight: 'bold',
                },
              },
            }
          },
        }
      });
    } else {
      // Modifica los valores de labels
      this.chart.data.labels = this.apiData.map((row: { categoria: string; totalResults: number }) => row.categoria);
      this.chart.data.datasets = Object.values(datasetsByCompany);
      // Hace el update del chart:
      this.chart.update();
    }
    //Importante añadirle el ancho y alto al canvas
    this.chart.canvas.width = 100;
    this.chart.canvas.height = 100;
  }

}