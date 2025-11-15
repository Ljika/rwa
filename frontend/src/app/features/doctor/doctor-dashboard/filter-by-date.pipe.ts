import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filterByDate',
  standalone: true
})
export class FilterByDatePipe implements PipeTransform {
  transform(items: any[], date: string): any[] {
    if (!date) return items;
    return items.filter(item => item.date === date);
  }
}